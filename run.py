"""
ORVIS — Ponto de entrada CLI.
Uso: python run.py
"""
import os
import sys
import time
import threading
import pygame

# Fix encoding para Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
from langchain_core.messages import HumanMessage, AIMessage

from core.agent import orvis_agent, is_local
from core.tools import memory, player, voice_mgr, current_voice
from services.notifier import ORVISNotifier


# --- Inicialização ---

pygame.mixer.init()

TEMP_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "data", "temp_audio")
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)


def process_voice_and_duck(resp, voice_name_pref):
    """Gera voz, baixa e toca localmente com ducking de música."""
    player.set_volume(15)

    v_res = voice_mgr.generate_voice(resp, voice=voice_name_pref)

    if v_res["status"] == "sucesso":
        filename = v_res["arquivo"]
        local_filename = os.path.join(TEMP_AUDIO_DIR, f"temp_{filename}")

        if voice_mgr.download_audio(filename, local_filename):
            try:
                pygame.mixer.music.load(local_filename)
                pygame.mixer.music.play()

                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)

                pygame.mixer.music.unload()
                if os.path.exists(local_filename):
                    os.remove(local_filename)
            except Exception:
                pass
            finally:
                player.set_volume(100)
        else:
            player.set_volume(100)
    else:
        player.set_volume(100)


def main():
    """Loop principal do ORVIS CLI."""
    from core.tools import current_voice as cv

    # Status
    notifier = ORVISNotifier()
    notifier.start()

    status_musica = "✅ ON" if player._check_api() else "❌ OFF"

    print(f"ORVIS: Pronto para agir (Motor: {'LOCAL' if is_local else 'GROQ'}).")
    print(f"Sistemas: Música [{status_musica}] | Voz [Aguardando]")

    # Recupera voz preferida
    active_voice = cv
    pref_voz = memory.search_memory("voz preferida", n_results=1)
    if "voz preferida" in pref_voz.lower() and "é" in pref_voz:
        try:
            active_voice = pref_voz.split("é")[-1].strip().split(".")[0].strip()
            print(f"🎙️ Voz carregada da memória: {active_voice}")
        except:
            pass

    chat_history = []

    while True:
        try:
            user_input = input("Otávio: ").strip()
            if user_input.lower() in {"sair", "fechar"}:
                break
            if not user_input:
                continue

            # Entrada final
            final_input = user_input

            resposta = orvis_agent(final_input, chat_history)
            print(f"ORVIS: {resposta}")

            # Voz em thread separada
            threading.Thread(
                target=process_voice_and_duck,
                args=(resposta, active_voice),
                daemon=True
            ).start()

            chat_history.append(HumanMessage(content=user_input))
            chat_history.append(AIMessage(content=resposta))
            if len(chat_history) > 6:
                chat_history = chat_history[-6:]

        except Exception as e:
            print(f"ORVIS: Erro -> {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()
