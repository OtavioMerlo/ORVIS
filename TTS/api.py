"""
ORVIS Voice Server API — Servidor de síntese de voz otimizado.
"""
import os
import shutil
import uuid
import json
import torch
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import anyio

# CORREÇÃO DE SEGURANÇA PYTORCH 2.6+: Força o carregamento do modelo XTTS ignorando a trava de 'weights_only'
import functools
original_load = torch.load
@functools.wraps(original_load)
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = safe_load
import torch.serialization
torch.serialization.load = safe_load

from TTS.api import TTS

# Configuração do backend de áudio
import torchaudio
try:
    if "soundfile" in torchaudio.list_audio_backends():
        torchaudio.set_audio_backend("soundfile")
except:
    pass

from utils.audio_utils import limpar_texto, processar_audio

app = FastAPI(title="Voice Cloning API - Jarvis")

# Configuração de CORS para permitir acesso de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICES_DIR = "./vozes"
OUTPUT_DIR = "./outputs"
BEST_SAMPLES_DIR = "./learning_list"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(BEST_SAMPLES_DIR, exist_ok=True)

GENERATION_CACHE = {}

print("Carregando o modelo XTTS v2... aguarde.")
device = "cuda" if torch.cuda.is_available() else "cpu"
try:
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    # Otimização de precisão para GPU (FP16) para dobrar a velocidade
    if device == "cuda":
        tts.model.half()
    print(f"Modelo carregado com sucesso no: {device}")
except Exception as e:
    print(f"Erro ao carregar o modelo: {e}")
    tts = None

class GenerateRequest(BaseModel):
    texto: str
    voz: str = "jarvis0-1"
    velocidade: float = 1.5
    temperatura: float = 0.5
    idioma: str = "pt"
    high_quality: bool = False # Se False, pula o processamento lento para resposta instantânea

class FeedbackRequest(BaseModel):
    arquivo: str
    e_bom: bool

@app.get("/")
async def saude():
    return {"status": "online", "dispositivo": device, "modelo_carregado": tts is not None}

@app.get("/audio/{arquivo}")
async def obter_audio(arquivo: str):
    caminho = os.path.join(OUTPUT_DIR, arquivo)
    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Áudio não encontrado.")
    return FileResponse(caminho, media_type="audio/wav")

@app.post("/stream")
async def gerar_audio_stream(req: GenerateRequest):
    """Gera áudio e retorna como stream de bytes para latência mínima."""
    if tts is None:
        raise HTTPException(status_code=500, detail="Modelo não carregado.")

    try:
        texto_limpo = limpar_texto(req.texto)
        caminho_voz = os.path.join(VOICES_DIR, req.voz)

        if not os.path.exists(caminho_voz):
            raise HTTPException(status_code=404, detail="Voz não encontrada.")

        amostras_voz = [os.path.join(caminho_voz, f) for f in os.listdir(caminho_voz) if f.endswith(".wav")]

        nome_arquivo = f"stream_{uuid.uuid4()}.wav"
        caminho_saida = os.path.join(OUTPUT_DIR, nome_arquivo)

        # Geração rápida
        def run_tts():
            tts.tts_to_file(
                text=texto_limpo,
                speaker_wav=amostras_voz,
                language=req.idioma,
                file_path=caminho_saida,
                speed=req.velocidade,
                temperature=req.temperatura,
            )

        await anyio.to_thread.run_sync(run_tts)

        # Retorna o arquivo como stream de bytes
        def iterfile():
            with open(caminho_saida, mode="rb") as f:
                yield from f
            # Comentamos a remoção imediata para evitar 404 no frontend
            # try:
            #     os.remove(caminho_saida)
            # except:
            #     pass

        return StreamingResponse(iterfile(), media_type="audio/wav")


    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no stream: {str(e)}")

@app.post("/generate")
async def gerar_audio(req: GenerateRequest):
    if tts is None:
        raise HTTPException(status_code=500, detail="Modelo não carregado.")

    try:
        texto_limpo = limpar_texto(req.texto)
        caminho_voz = os.path.join(VOICES_DIR, req.voz)

        if not os.path.exists(caminho_voz):
            raise HTTPException(status_code=404, detail=f"Pasta de voz '{req.voz}' não encontrada.")

        amostras_voz = [os.path.join(caminho_voz, f) for f in os.listdir(caminho_voz) if f.endswith(".wav")]
        if not amostras_voz:
            raise HTTPException(status_code=400, detail="Nenhum arquivo .wav encontrado.")

        nome_arquivo = f"{uuid.uuid4()}.wav"
        caminho_saida = os.path.join(OUTPUT_DIR, nome_arquivo)
        GENERATION_CACHE[nome_arquivo] = texto_limpo

        def run_tts():
            tts.tts_to_file(
                text=texto_limpo,
                speaker_wav=amostras_voz,
                language=req.idioma,
                file_path=caminho_saida,
                speed=req.velocidade,
                temperature=req.temperatura,
            )

        await anyio.to_thread.run_sync(run_tts)

        if req.high_quality:
            await anyio.to_thread.run_sync(processar_audio, caminho_saida, caminho_saida)

        return {
            "status": "sucesso",
            "arquivo": nome_arquivo,
            "url_acesso": f"/audio/{nome_arquivo}",
            "texto_processado": texto_limpo
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na geração: {str(e)}")

@app.post("/feedback")
async def processar_feedback(req: FeedbackRequest):
    caminho_origem = os.path.join(OUTPUT_DIR, req.arquivo)
    if not os.path.exists(caminho_origem):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    if req.e_bom:
        caminho_destino = os.path.join(BEST_SAMPLES_DIR, req.arquivo)
        shutil.copy(caminho_origem, caminho_destino)
        return {"status": "sucesso", "mensagem": "Áudio salvo."}

    return {"status": "sucesso", "mensagem": "Feedback recebido."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
