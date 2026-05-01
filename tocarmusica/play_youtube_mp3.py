#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import subprocess
import os
import json
import shutil
import sys
import threading
import time
import msvcrt
import psutil

class MusicPlayer:
    def __init__(self):
        self.process_ytdlp = None
        self.process_ffplay = None
        self.paused = False
        self.running = False

    def _suspend_process(self, proc):
        if not proc: return
        try:
            p = psutil.Process(proc.pid)
            for child in p.children(recursive=True):
                if self.paused: child.resume()
                else: child.suspend()
            if self.paused: p.resume()
            else: p.suspend()
        except: pass

    def toggle_pause(self):
        if not self.process_ffplay: return
        
        # Inverte o estado de suspensão de ambos os processos no pipe
        self._suspend_process(self.process_ffplay)
        self._suspend_process(self.process_ytdlp)
        
        self.paused = not self.paused
        status = "⏸️  PAUSADO" if self.paused else "▶️  RETOMADO"
        print(f"\n{status}")

    def stop(self):
        try:
            for p in [self.process_ytdlp, self.process_ffplay]:
                if p:
                    proc = psutil.Process(p.pid)
                    for child in proc.children(recursive=True): child.kill()
                    proc.kill()
        except: pass
        self.process_ytdlp = None
        self.process_ffplay = None
        self.running = False
        self.paused = False

    def play(self, query, cookies=None):
        self.stop()
        self.running = True
        
        # yt-dlp configurado para enviar áudio para o stdout (pipe)
        ytdlp_cmd = [
            "yt-dlp", query, 
            "-o", "-", 
            "-f", "bestaudio", 
            "--quiet", "--no-warnings", 
            "--buffer-size", "16K"
        ]
        if cookies:
            ytdlp_cmd.extend(["--add-header", f"Cookie: {cookies}"])
        
        # ffplay configurado para ler do stdin (pipe:0)
        ffplay_cmd = ["ffplay", "-i", "pipe:0", "-nodisp", "-autoexit", "-loglevel", "quiet"]

        try:
            # Iniciando o pipe
            self.process_ytdlp = subprocess.Popen(ytdlp_cmd, stdout=subprocess.PIPE)
            self.process_ffplay = subprocess.Popen(ffplay_cmd, stdin=self.process_ytdlp.stdout)
            
            print("\n" + "═"*60)
            print("🎵  REPRODUZINDO COM ESTABILIDADE (PIPE)")
            print("⌨️   Comandos: [P] Pause/RESUME | [Q] Pular | [S] Sair")
            print("═"*60)
        except Exception as e:
            print(f"❌ Erro ao iniciar: {e}")
            self.running = False

def input_thread(player):
    while True:
        if msvcrt.kbhit():
            key = msvcrt.getch().decode('utf-8', errors='ignore').lower()
            if key == 'p':
                player.toggle_pause()
            elif key == 'q':
                print("\n⏭️  Pulando...")
                player.stop()
            elif key == 's':
                print("\n🚪 Saindo...")
                player.stop()
                os._exit(0)
        time.sleep(0.1)

def check_dependencies():
    for dep in ["ffplay", "yt-dlp"]:
        if not shutil.which(dep):
            print(f"❌ Erro: '{dep}' não instalado.")
            return False
    return True

def le_cookies():
    if os.path.exists("cookies.json"):
        try:
            with open("cookies.json", "r", encoding="utf-8") as f:
                d = json.load(f)
            return "; ".join(f"{i['name']}={i['value']}" for i in d if 'name' in i)
        except: pass
    return None

def main():
    if not check_dependencies(): return
    player = MusicPlayer()
    cookies = le_cookies()
    threading.Thread(target=input_thread, args=(player,), daemon=True).start()

    print("\n🎸 PLAYER ESTABILIZADO - Digite e aperte ENTER")
    while True:
        try:
            query = input("\n🔎 Música ou Link: ").strip()
            if not query: continue
            if query.lower() in ['sair', 's']: break
            
            # Se não for link, faz a busca pelo nome
            final_query = query if query.startswith("http") else f"ytsearch1:{query}"
            if not query.startswith("http"):
                print(f"🔍 Buscando '{query}' no YouTube...")

            player.play(final_query, cookies)
            
            # Monitora se a música ainda está tocando
            while player.running:
                if player.process_ffplay and player.process_ffplay.poll() is not None:
                    break
                time.sleep(0.5)
            player.running = False
            
        except KeyboardInterrupt: break

if __name__ == "__main__":
    main()