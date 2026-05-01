import os
import re
import json
import time
import base64
import sys
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import APIKeyHeader
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Fix encoding para Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# --- Imports do ORVIS ---
from core.agent import orvis_agent
from core.tools import voice_mgr, player, memory
from services.notifier import ORVISNotifier
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Carrega variáveis de ambiente
load_dotenv()

# --- Configurações de Segurança ---
API_KEY_NAME = "X-ORVIS-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

def verify_api_key(api_key: str = Depends(api_key_header)):
    expected_key = os.getenv("ORVIS_API_KEY")
    if not expected_key:
        # Se não houver chave no .env, permite passar (para não quebrar o desenvolvimento inicial)
        # Mas avisa no console
        print("⚠️ AVISO: ORVIS_API_KEY não configurada no .env. API está pública!")
        return api_key
    if api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: Chave de API inválida ou ausente."
        )
    return api_key

# --- App FastAPI ---

app = FastAPI(
    title="ORVIS API",
    description="API do assistente pessoal ORVIS — Cérebro, Memória, Agenda e Voz.",
    version="1.0.0"
)

# Configuração de CORS (Liberado conforme solicitado)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Notificador de Tarefas
notifier = ORVISNotifier()
notifier.start()

# Monta a pasta de áudio temporário
TEMP_AUDIO_DIR = "data/temp_audio"
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=TEMP_AUDIO_DIR), name="audio")

# --- Modelos de Dados ---

class ChatRequest(BaseModel):
    message: str
    personality: str = "orvis"
    history: list = []

# --- Sessões de chat em memória ---
sessions: dict[str, list] = {}

# --- Endpoints ---

@app.get("/health")
async def health_check():
    """Retorna o status do sistema."""
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "sistemas": {
            "memoria": "ok",
            "tarefas": "ok"
        }
    }

@app.post("/chat", dependencies=[Depends(verify_api_key)])
async def chat_endpoint(req: Request):
    """Processa uma mensagem de chat e retorna a resposta da IA."""
    try:
        data = await req.json()
        message = data.get("message")
        personality = data.get("personality", "orvis")
        session_id = data.get("session_id")
        
        # Recupera histórico da sessão se existir
        history = []
        if session_id:
            history = sessions.get(session_id, [])
            
        # Executa o agente
        agente_res = orvis_agent(message, history, personality=personality)
        resposta = agente_res.get("content")
        music_url = agente_res.get("music_url")
        
        # Atualiza histórico da sessão
        if session_id:
            history.append(HumanMessage(content=message))
            history.append(AIMessage(content=resposta))
            sessions[session_id] = history[-10:] # Mantém as últimas 10 mensagens
            
        return {
            "content": resposta,
            "music_url": music_url,
            "status": "sucesso",
            "session_id": session_id
        }
    except Exception as e:
        print(f"❌ Erro no /chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "erro", "detail": str(e)}
        )

@app.post("/voice", dependencies=[Depends(verify_api_key)])
async def voice_endpoint(
    text: Optional[str] = Form(None),
    voice: Optional[str] = Form(None),
    personality: str = Form("orvis"),
    session_id: Optional[str] = Form(None),
    generate_audio: bool = Form(True),
    file: Optional[UploadFile] = File(None)
):
    """
    Endpoint versátil para voz:
    1. Se receber 'audio': faz STT -> Agente -> TTS
    2. Se receber 'text': faz TTS direto (ou Agente -> TTS se especificado)
    """
    try:
        is_chat = False
        input_text = text
        
        # 1. Se houver áudio, transcreve primeiro e marca como chat
        if file:
            is_chat = True
            # Salva temporário
            temp_path = os.path.join(TEMP_AUDIO_DIR, f"voice_input_{int(time.time())}.wav")
            with open(temp_path, "wb") as f:
                f.write(await file.read())
            
            # Transcreve usando Groq Whisper
            input_text = voice_mgr.speech_to_text(temp_path)
            
            # Limpa o arquivo de entrada
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            print(f"🎙️ Transcrição: {input_text}")

        if not input_text:
            raise HTTPException(status_code=400, detail="Nenhum texto ou áudio fornecido")

        # 2. Processa com o Agente se for chat
        if is_chat:
            history = sessions.get(session_id, []) if session_id else []
            agente_res = orvis_agent(input_text, history, personality=personality)
            resposta_texto = agente_res.get("content")
            music_url = agente_res.get("music_url")
            
            if session_id:
                history.append(HumanMessage(content=input_text))
                history.append(AIMessage(content=resposta_texto))
                sessions[session_id] = history[-10:]
        else:
            # Apenas TTS do texto fornecido
            resposta_texto = input_text
            music_url = None

        # 3. Gera Áudio da resposta (TTS)
        audio_url = None
        filename = None
        
        if generate_audio:
            active_voice = voice
            if not active_voice:
                from core.tools import current_voice
                active_voice = current_voice

            v_res = voice_mgr.generate_voice(resposta_texto, voice=active_voice)
            
            if v_res["status"] == "sucesso":
                filename = v_res["arquivo"]
                base_url = os.getenv("ORVIS_API_EXTERNAL_URL", "http://localhost:8085")
                audio_url = f"{base_url}/audio/{filename}"
            else:
                print(f"⚠️ Erro ao gerar TTS: {v_res.get('mensagem')}")

        return {
            "status": "sucesso",
            "input_text": input_text,
            "content": resposta_texto,
            "audio_url": audio_url,
            "filename": filename,
            "session_id": session_id
        }
            
    except Exception as e:
        print(f"❌ Erro no /voice: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "erro", "detail": str(e)}
        )

@app.post("/api/speech-to-text", dependencies=[Depends(verify_api_key)])
async def stt_endpoint(audio: UploadFile = File(...)):
    """Converte áudio recebido em texto."""
    try:
        # Salva o arquivo temporariamente para processar
        temp_path = os.path.join(TEMP_AUDIO_DIR, f"upload_{int(time.time())}.wav")
        with open(temp_path, "wb") as f:
            f.write(await audio.read())
            
        # Aqui você integraria com o seu serviço de STT (ex: Groq Whisper)
        # Como o código original chamava o voice_mgr ou similar:
        from core.tools import voice_mgr
        text = voice_mgr.speech_to_text(temp_path)
        
        # Limpa o arquivo
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return {"text": text}
    except Exception as e:
        print(f"❌ Erro no /api/speech-to-text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "ORVIS API Online",
        "version": "1.0.0",
        "endpoints": ["/health", "/chat", "/voice", "/api/speech-to-text"]
    }

if __name__ == "__main__":
    import uvicorn
    # Inicia o servidor uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8085)
