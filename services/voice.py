import os
import requests
import uuid



class ORVISVoiceManager:
    def __init__(self, base_url=None):
        self.base_url = base_url or os.getenv("ORVIS_VOICE_API_URL", "http://localhost:8000")

    def generate_voice(self, text, voice="jarvis0-1", speed=1.0, temperature=0.5):
        """Solicita a geração de voz via Piper TTS API."""
        import re
        # Remove emojis e símbolos que não devem ser lidos (markdown, caracteres especiais)
        text = re.sub(r'[\U00010000-\U0010ffff]|[\u2600-\u27ff]', '', text)
        text = re.sub(r'[*_~`#@$%&()]', '', text)
        
        payload = {
            "text": text,
            "voice": voice,
            "speed": speed
        }
        try:
            # Novo endpoint /synthesize da Piper API
            response = requests.post(f"{self.base_url}/synthesize", json=payload, stream=True)
            if response.status_code == 200:
                filename = f"voice_{uuid.uuid4()}.wav"
                local_path = os.path.join(os.path.dirname(__file__), "..", "data", "temp_audio", filename)
                os.makedirs(os.path.dirname(local_path), exist_ok=True)

                with open(local_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                # A URL agora aponta para o ORVIS API (porta 8085 por padrão) que serve a pasta /audio
                orvis_api_url = os.getenv("ORVIS_API_EXTERNAL_URL", "http://localhost:8085")
                return {
                    "status": "sucesso", 
                    "arquivo": filename, 
                    "path": local_path,
                    "url": f"{orvis_api_url}/audio/{filename}"
                }
            
            return {"status": "erro", "mensagem": f"Erro na API Piper: {response.status_code}"}
        except Exception as e:
            return {"status": "erro", "mensagem": f"Conexão com Piper falhou: {e}"}


    def send_feedback(self, filename, is_good=True):
        """Envia feedback sobre a qualidade do áudio gerado."""
        payload = {
            "arquivo": filename,
            "e_bom": is_good
        }
        try:
            response = requests.post(f"{self.base_url}/feedback", json=payload)
            if response.status_code == 200:
                return {"status": "sucesso", "mensagem": "Feedback enviado com sucesso."}
            return {"status": "erro", "mensagem": f"Erro na API: {response.text}"}
        except Exception as e:
            return {"status": "erro", "mensagem": f"Conexão falhou: {e}"}

    def download_audio(self, filename, local_path):
        """Baixa o arquivo de áudio da API para reprodução local."""
        try:
            response = requests.get(f"{self.base_url}/audio/{filename}", stream=True)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
            return False
        except:
            return False

    def speech_to_text(self, audio_path):
        """Converte áudio em texto usando Groq Whisper."""
        from groq import Groq
        api_key = os.getenv("online2")
        if not api_key:
            return "Erro: API Key do Groq (online2) não encontrada no .env"
            
        client = Groq(api_key=api_key)
        
        try:
            with open(audio_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(os.path.basename(audio_path), file.read()),
                    model="whisper-large-v3",
                    language="pt",
                    response_format="text"
                )
            return transcription
        except Exception as e:
            print(f"❌ Erro no STT (Groq): {str(e)}")
            return f"Erro no processamento de áudio: {str(e)}"
