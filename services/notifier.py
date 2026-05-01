"""
ORVIS Notifier — Serviço de monitoramento de prazos e alertas.
"""
import time
import threading
import os
from datetime import datetime
from core.tools import tasks, voice_mgr, current_voice

class ORVISNotifier:
    def __init__(self, check_interval=60):
        self.check_interval = check_interval
        self.running = False
        self.thread = None

    def _check_deadlines(self):
        """Verifica se há tarefas com prazo para o momento atual."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Recarrega tarefas do disco para pegar atualizações via API/Tools
        tasks.tasks = tasks._load_tasks()

        pending_tasks = [t for t in tasks.tasks if t["status"] == "pendente" and t["prazo"]]

        for t in pending_tasks:
            if t["prazo"].startswith(now):
                self.trigger_alert(t["descricao"])

    def trigger_alert(self, description):
        """Faz o ORVIS falar o lembrete."""
        msg = f"Otávio, lembrete: {description}"
        print(f"\n🔔 [ALERTA ORVIS]: {msg}")

        # Usa a voz atual para notificar
        try:
            v_res = voice_mgr.generate_voice(msg, voice=current_voice)
            if v_res["status"] == "sucesso":
                # Para simplificar o alerta, podemos usar o download e play rápido
                # ou apenas imprimir se estivermos em modo API.
                # No modo CLI (run.py), vamos tentar tocar o áudio.
                filename = v_res["arquivo"]
                local_path = os.path.join(os.path.dirname(__file__), "..", "data", "temp_audio", f"alert_{filename}")
                if voice_mgr.download_audio(filename, local_path):
                    import pygame
                    if not pygame.mixer.get_init():
                        pygame.mixer.init()
                    pygame.mixer.music.load(local_path)
                    pygame.mixer.music.play()
                    while pygame.mixer.music.get_busy():
                        time.sleep(0.1)
                    pygame.mixer.music.unload()
                    os.remove(local_path)
        except Exception as e:
            print(f"Erro ao disparar alerta de voz: {e}")

    def _run_loop(self):
        """Loop infinito de verificação."""
        while self.running:
            try:
                self._check_deadlines()
            except Exception as e:
                print(f"Erro no Notificador ORVIS: {e}")
            time.sleep(self.check_interval)

    def start(self):
        """Inicia o monitor em uma thread separada."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            print("🔔 Sistema de Notificações do ORVIS Ativado.")

    def stop(self):
        """Para o monitor."""
        self.running = False
        if self.thread:
            self.thread.join()
