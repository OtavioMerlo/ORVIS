"""
API FastAPI para síntese de voz usando Piper TTS
Converte texto em áudio de fala em português brasileiro
"""

import io
import os
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import logging
import re

# Diretório do projeto  
PROJECT_DIR = Path(__file__).parent

# Configurar variáveis de ambiente
os.environ["ESPEAK_DATA_PATH"] = r"C:\piper_temp\espeak-ng-data"
# Adicionar diretório do projeto ao PATH para encontrar DLLs
os.environ["PATH"] = str(PROJECT_DIR) + ";" + os.environ.get("PATH", "")

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Piper Voice API",
    description="API para síntese de voz com Piper TTS em português",
    version="1.0.0"
)

# Diretório do projeto
PROJECT_DIR = Path(__file__).parent
PIPER_EXE = PROJECT_DIR / "piper.exe"
MODEL_PATH = PROJECT_DIR / "pt_BR-faber-medium.onnx"
ESPEAK_DATA = PROJECT_DIR / "espeak-ng-data"


class TextToSpeechRequest(BaseModel):
    """Modelo para requisição de síntese de voz"""
    text: str
    voice: str = "jarvis0-1"


class VoiceInfo(BaseModel):
    """Informações sobre a voz disponível"""
    language: str
    model_path: str
    available: bool


@app.get("/health")
async def health_check():
    """Verifica se a API está operacional"""
    return {"status": "ok", "service": "Piper Voice API"}


@app.get("/voice/info", response_model=VoiceInfo)
async def voice_info():
    """Retorna informações sobre a voz carregada"""
    try:
        return VoiceInfo(
            language="pt_BR",
            model_path=str(MODEL_PATH),
            available=MODEL_PATH.exists()
        )
    except Exception as e:
        logger.error(f"Erro ao obter informações da voz: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao carregar informações da voz"
        )


@app.post("/synthesize")
async def synthesize(request: TextToSpeechRequest):
    """
    Sintetiza texto em áudio
    
    Args:
        text: Texto a ser convertido em fala
    
    Returns:
        Arquivo de áudio WAV em streaming
    """
    try:
        # Remove emojis e símbolos que não devem ser lidos (markdown, caracteres especiais)
        text = re.sub(r'[\U00010000-\U0010ffff]|[\u2600-\u27ff]', '', request.text)
        text = re.sub(r'[*_~`#@$%&()]', '', text)
        
        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Texto não pode estar vazio"
            )
        
        if len(request.text) > 5000:
            raise HTTPException(
                status_code=400,
                detail="Texto muito longo (máximo 5000 caracteres)"
            )
        
        logger.info(f"Sintetizando ({request.voice}): {text[:100]}...")
        
        # Configurações de naturalidade
        length_scale = 1.0  # Velocidade (maior = mais lento)
        noise_scale = 0.667 # Variação de entonação
        sentence_silence = 0.2 # Pausa entre frases
        
        # Mapeamento de vozes para modelos onnx
        voice_model = "pt_BR-faber-medium.onnx"
        if request.voice == "pt-BR-sage-13364":
            voice_model = "pt_BR-sage_13364-medium.onnx"
            length_scale = 1.05  # Sage soa melhor levemente mais lenta
            sentence_silence = 0.4 # Pausas maiores para a Cloe parecer mais calma
        elif request.voice == "dii_pt_br":
            voice_model = "dii_pt-BR.onnx"
            length_scale = 1.0
            noise_scale = 0.6  # Reduzido para ficar mais limpo
            sentence_silence = 0.2 # Pausas mais curtas para soar mais fluido
            
        current_model_path = PROJECT_DIR / voice_model

        if not PIPER_EXE.exists():
            raise FileNotFoundError(f"Piper não encontrado: {PIPER_EXE}")
        
        if not current_model_path.exists():
            raise FileNotFoundError(f"Modelo não encontrado: {current_model_path}")
        
        # Salva temporariamente o texto em arquivo
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as text_file:
            text_file.write(text)
            text_path = text_file.name
        
        # Nome para arquivo de saída no diretório temp ASCII
        output_filename = f"audio_{os.urandom(4).hex()}.wav"
        output_path = f"C:\\piper_temp\\{output_filename}"
        
        try:
            # Executa o piper.exe com o modelo selecionado
            cmd = [
                "piper.exe",
                "--model", voice_model,
                "--espeak_data", r"C:\piper_temp\espeak-ng-data",
                "--length_scale", str(length_scale),
                "--noise_scale", str(noise_scale),
                "--sentence_silence", str(sentence_silence),
                "--output_file", output_path
            ]
            
            logger.info(f"Sintetizando com Piper...")
            
            # Lê o arquivo de texto e passa via stdin
            text_content = text
            
            result = subprocess.run(
                cmd,
                input=text_content.encode('utf-8'),
                capture_output=True,
                timeout=30,
                cwd=str(PROJECT_DIR)  # Define diretório de trabalho
            )
            
            if result.returncode != 0:
                stderr_msg = result.stderr.decode('utf-8', errors='ignore')
                logger.error(f"Erro do Piper: {stderr_msg}")
                raise RuntimeError(f"Piper falhou com código {result.returncode}: {stderr_msg}")
            
            # Lê o arquivo de áudio gerado
            if not Path(output_path).exists():
                raise FileNotFoundError(f"Arquivo de saída não foi criado: {output_path}")
            
            with open(output_path, 'rb') as f:
                audio_bytes = f.read()
            
            logger.info(f"Áudio gerado: {len(audio_bytes)} bytes")
            
            return StreamingResponse(
                iter([audio_bytes]),
                media_type="audio/wav",
                headers={"Content-Disposition": "attachment; filename=output.wav"}
            )
        
        finally:
            # Limpa arquivos temporários
            if Path(text_path).exists():
                Path(text_path).unlink()
            if Path(output_path).exists():
                Path(output_path).unlink()
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na síntese: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao sintetizar áudio: {str(e)}"
        )


@app.get("/")
async def root():
    """Informações da API"""
    return {
        "name": "Piper Voice API",
        "description": "Síntese de voz com Piper TTS",
        "version": "1.0.0",
        "language": "Portuguese (Brazilian)",
        "endpoints": {
            "health": "/health",
            "voice_info": "/voice/info",
            "synthesize": "/synthesize (POST)",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8080,
        log_level="info"
    )
