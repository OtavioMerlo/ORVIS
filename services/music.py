import os
import requests


class ORVISMusicPlayer:
    def __init__(self, base_url=None):
        self.base_url = base_url or os.getenv("ORVIS_MUSIC_API_URL", "http://localhost:8900")

    def _check_api(self):
        """Internal helper to check if API is alive."""
        try:
            requests.get(self.base_url, timeout=1)
            return True
        except:
            return False

    def play(self, query):
        """Começa a tocar uma música via API local."""
        try:
            response = requests.post(f"{self.base_url}/play", params={"query": query}, timeout=5)
            if response.status_code == 200:
                return f"🎵 Tocando agora: '{query}'."
            return f"❌ Erro na API de música: {response.status_code}"
        except Exception as e:
            return "📡 API de música offline ou inacessível."

    def get_stream_url(self, query):
        """Obtém a URL de streaming para o frontend."""
        try:
            response = requests.get(f"{self.base_url}/get_url", params={"query": query}, timeout=10)
            if response.status_code == 200:
                return response.json().get("url")
            return None
        except:
            return None

    def pause(self):
        """Pausa a música."""
        try:
            response = requests.post(f"{self.base_url}/pause", timeout=3)
            return "⏸️ Música pausada." if response.status_code == 200 else "⚠️ Falha ao pausar."
        except Exception:
            return "📡 Erro de conexão com player."

    def resume(self):
        """Retoma a música."""
        try:
            response = requests.post(f"{self.base_url}/pause", timeout=3)
            return "▶️ Música retomada." if response.status_code == 200 else "⚠️ Falha ao retomar."
        except Exception:
            return "📡 Erro de conexão com player."

    def stop(self):
        """Para a música."""
        try:
            response = requests.post(f"{self.base_url}/stop", timeout=3)
            return "⏹️ Música parada." if response.status_code == 200 else "⚠️ Falha ao parar."
        except Exception:
            return "📡 Erro de conexão com player."

    def set_volume(self, level: int):
        """Ajusta o volume da música (0-100)."""
        try:
            response = requests.post(f"{self.base_url}/volume", params={"level": level}, timeout=2)
            return f"🔊 Volume: {level}%" if response.status_code == 200 else "⚠️ Erro volume."
        except Exception:
            return "📡 Erro conexão volume."

    def get_status(self):
        """Verifica o que está tocando."""
        try:
            response = requests.get(f"{self.base_url}/status", timeout=2)
            if response.status_code == 200:
                data = response.json()
                return f"Estado: {data.get('status', '???')} | Música: {data.get('current_song', 'Nenhuma')} | Volume: {data.get('volume', '???')}%"
            return "⚠️ Status indisponível."

        except Exception:
            return "📡 Player offline."
