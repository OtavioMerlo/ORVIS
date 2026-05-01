# <p align="center">🧠 ORVIS — Operational Reactive Virtual Intelligent System</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Operational-00f3ff?style=for-the-badge&logo=opsgenie" alt="Status">
  <img src="https://img.shields.io/badge/Voz-Active-7C3AED?style=for-the-badge&logo=audio-technica" alt="Voice">
  <img src="https://img.shields.io/badge/Neural-Core%20v2-F43F5E?style=for-the-badge&logo=brainly" alt="Neural Core">
</p>

---

## 🌌 Visão Geral

**ORVIS** é um ecossistema de inteligência artificial de elite, projetado para ser mais que um assistente: um parceiro operacional estratégico. Criado por **Otávio Merlo Carvalho**, o sistema integra processamento de linguagem natural avançado, memória persistente de longo prazo e uma interface HUD (Heads-Up Display) futurista.

O projeto abriga duas personalidades principais:
- **ORVIS**: O assistente central, focado em produtividade, automação e controle.
- **CLOE**: Uma IA especializada em cuidado, empatia e monitoramento de rotina, dedicada à proteção e acompanhamento da Vitória.

---

## ✨ Funcionalidades de Elite

### 🧠 Cérebro Neural (Memory RAG)
Diferente de assistentes comuns, o ORVIS possui memória real. Ele utiliza **ChromaDB** e **Supabase** para armazenar preferências, conversas passadas e fatos importantes, permitindo uma continuidade perfeita entre sessões.

### 🎙️ Síntese de Voz & Audição
- **STT (Speech-to-Text)**: Transcrição em tempo real via Groq (Whisper-v3).
- **TTS (Text-to-Speech)**: Síntese de voz de alta fidelidade com modelos personalizados (Jarvis e Cloe).

### 🎵 Central de Mídia
Sistema integrado de streaming de áudio que extrai URLs diretas do YouTube via `yt-dlp`, permitindo reprodução nativa no dispositivo (Mobile/Web) sem sobrecarregar o servidor.

### 🎨 Design HUD Futurista
Interfaces construídas com foco em estética **Glassmorphism** e **Neon Cyberpunk**, utilizando `Framer Motion` (Web) e `Reanimated` (Mobile) para micro-interações fluidas e imersivas.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Inteligência** | Python, LangChain, Groq (Llama 3.3 70B / Qwen 2.5) |
| **Backend** | FastAPI, Uvicorn, Requests |
| **Banco de Dados** | Supabase (PostgreSQL), ChromaDB (Vetorial) |
| **Frontend Web** | Vite, React, TailwindCSS, Lucide Icons |
| **Mobile** | React Native, Expo, Reanimated |
| **Áudio/Mídia** | yt-dlp, Piper TTS, Whisper |

---

## 🚀 Estrutura do Projeto

```text
ORVIS/
├── core/               # 🧠 Orquestração do Agente e Ferramentas (ReAct)
├── services/           # 🔌 Integrações (Memória, Música, Tarefas, Voz)
├── mobile/             # 📱 App React Native (Expo)
├── frontend/           # 💻 Dashboard Web (Vite + React)
├── tocarmusica/        # 🎵 API Independente de Streaming de Áudio
└── TTS/                # 🎙️ Motor de Síntese de Voz
```

---

## 🛡️ Auditoria de Segurança & Privacidade

> [!IMPORTANT]
> **Antes de subir para o GitHub, verifique:**
> 1. **Filtro de Segredos**: O arquivo `.env` **NUNCA** deve ser commitado. Ele contém suas chaves do Groq, OpenAI e Supabase.
> 2. **Códigos de Acesso**: Remova ou mova para variáveis de ambiente o código do **MODO MESTRE** (atualmente em `core/prompts/cloe.txt`).
> 3. **Logs de Debug**: Apague o arquivo `agent_debug.log`, pois ele pode conter transcrições de conversas privadas.
> 4. **Gitignore**: Certifique-se de que `node_modules`, `venv`, `__pycache__` e `.env` estão listados no `.gitignore`.

---

<p align="center">
  Criado com paixão por <b>Otávio Merlo Carvalho</b><br>
  <i>"O futuro é operacional."</i>
</p>
