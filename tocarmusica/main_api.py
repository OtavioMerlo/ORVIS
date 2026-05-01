import os
import subprocess
import shutil
import threading
import time
import psutil
import sys
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Fix encoding para Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Carrega variáveis do .env

load_dotenv()

app = FastAPI(title="Player de Música API", description="API para controlar o tocador de música no servidor")

# Configuração de CORS para permitir acesso de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MusicPlayer:
    def __init__(self):
        self.process_ytdlp = None
        self.process_ffplay = None
        self.paused = False
        self.running = False
        self.current_song = None
        self.volume = 100  # Volume padrão (0-100)


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
        if not self.process_ffplay:
            raise HTTPException(status_code=400, detail="Nada está tocando no momento")
        
        self._suspend_process(self.process_ffplay)
        self._suspend_process(self.process_ytdlp)
        
        self.paused = not self.paused
        return {"status": "pausado" if self.paused else "retomado"}

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
        self.current_song = None
        return {"status": "parado"}

    def get_url(self, query: str):
        """Apenas extrai a URL de streaming sem tocar localmente."""
        final_query = query if query.startswith("http") else f"ytsearch1:{query}"
        cmd = ["yt-dlp", "--get-url", "-f", "bestaudio", "--quiet", final_query]
        try:
            url = subprocess.check_output(cmd).decode("utf-8").strip()
            return {"status": "sucesso", "url": url, "musica": query}
        except Exception as e:
            return {"status": "erro", "mensagem": str(e)}

    def play(self, query: str):
        self.stop()
        self.running = True
        self.current_song = query
        print(f"🎵 Iniciando reprodução: {query} (Volume: {self.volume}%)")

        
        cookies = os.getenv("YT_COOKIES")
        
        # Se não for link, busca no YouTube
        final_query = query if query.startswith("http") else f"ytsearch1:{query}"
        
        ytdlp_cmd = [
            "yt-dlp", final_query, 
            "-o", "-", 
            "-f", "bestaudio", 
            "--quiet", "--no-warnings", 
            "--buffer-size", "16K"
        ]
        if cookies:
            ytdlp_cmd.extend(["--add-header", f"Cookie: {cookies}"])
        
        ffplay_cmd = [
            "ffplay", "-i", "pipe:0", 
            "-nodisp", "-autoexit", 
            "-loglevel", "quiet",
            "-volume", str(self.volume)
        ]


        try:
            self.process_ytdlp = subprocess.Popen(ytdlp_cmd, stdout=subprocess.PIPE)
            self.process_ffplay = subprocess.Popen(ffplay_cmd, stdin=self.process_ytdlp.stdout)
            return {"status": "tocando", "musica": query}
        except Exception as e:
            self.running = False
            raise HTTPException(status_code=500, detail=f"Erro ao iniciar tocador: {str(e)}")

    def set_volume(self, level: int):
        self.volume = max(0, min(100, level))
        print(f"🔊 Volume ajustado para: {self.volume}%")
        
        # Se estiver tocando, poderíamos tentar reiniciar o player, 
        # mas por enquanto vamos apenas aplicar para a próxima música
        # ou informar que foi alterado.
        return {"status": "sucesso", "volume": self.volume}


# Instância global do player
player = MusicPlayer()

@app.post("/play")
async def play_music(query: str):
    """Toca uma música via nome ou link."""
    return player.play(query)

@app.get("/get_url")
async def get_music_url(query: str):
    """Retorna apenas a URL de streaming."""
    return player.get_url(query)

@app.post("/pause")
async def pause_music():
    """Alterna entre pause e play."""
    return player.toggle_pause()

@app.post("/stop")
async def stop_music():
    """Para a música atual."""
    return player.stop()

@app.post("/volume")
async def set_volume(level: int):
    """Ajusta o volume do player (0-100)."""
    return player.set_volume(level)


@app.get("/status")
async def get_status():
    """Retorna o estado atual do player."""
    state = "parado"
    if player.running:
        state = "pausado" if player.paused else "tocando"
        
    return {
        "status": state,
        "musica_atual": player.current_song,
        "volume": player.volume,
        "ffmpeg_running": player.process_ffplay.poll() is None if player.process_ffplay else False

    }

@app.get("/")
async def root():
    return {"message": "API de Música Ativa!", "endpoints": ["/play", "/pause", "/stop", "/status"]}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Iniciando servidor na porta {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
