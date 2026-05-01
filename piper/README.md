# 🎤 Piper Voice API

API FastAPI para síntese de voz offline em português brasileiro usando Piper TTS.

## ✨ Recursos

- ✅ Síntese de voz de alta qualidade em português (Brasil)
- ✅ Funciona completamente offline
- ✅ API REST com FastAPI
- ✅ Documentação interativa Swagger
- ✅ Tratamento robusto de erros

## 🚀 Como iniciar

### 1. Inicie o servidor

```bash
python main.py
```

Você verá:
```
INFO:     Started server process [XXXX]
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### 2. Use um cliente para testar

## 📱 Opções de Cliente

### ✅ **Opção 1: Python (RECOMENDADO)**

Use o cliente Python sem limitações:

```bash
# Modo interativo
python client.py

# Ou direto na linha de comando
python client.py "Olá, tudo bem?"
```

### ✅ **Opção 2: cURL**

```bash
curl -X POST http://127.0.0.1:8080/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, tudo bem?"}' \
  --output audio.wav
```

### ✅ **Opção 3: Swagger UI (Navegador)**

Abra seu navegador e vá para:
```
http://127.0.0.1:8080/docs
```

No Swagger UI:
1. Clique em "POST /synthesize"
2. Clique em "Try it out"
3. Digite seu texto em JSON:
   ```json
   {
     "text": "Seu texto aqui"
   }
}
   ```
4. Clique em "Execute"
5. Download do WAV estará no resultado

### ❌ **Evitar: Postman/Insomnia (versão gratuita)**

A versão gratuita do Postman/Insomnia tem limitação: "Binary file responses are supported only in the paid version"

**Solução**: Use Python client ou cURL em vez disso!

## 📡 API Endpoints

### GET /health
Verifica se a API está operacional

```bash
curl http://127.0.0.1:8080/health
```

Resposta:
```json
{"status": "ok", "service": "Piper Voice API"}
```

### GET /voice/info
Retorna informações da voz

```bash
curl http://127.0.0.1:8080/voice/info
```

Resposta:
```json
{
  "language": "pt_BR",
  "model_path": "C:\\...",
  "available": true
}
```

### POST /synthesize
Sintetiza texto em áudio WAV

**Request:**
```json
{
  "text": "Seu texto aqui"
}
```

**Parameters:**
- `text` (string, required): Texto a ser sintetizado (máximo 5000 caracteres)

**Response:**
- `Content-Type`: audio/wav
- `Body`: Arquivo WAV binário

**Exemplo:**
```bash
curl -X POST http://127.0.0.1:8080/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá mundo"}' \
  --output output.wav
```

### GET /
Informações gerais da API

```bash
curl http://127.0.0.1:8080/
```

## 🐍 Exemplos de Código Python

### Exemplo 1: Básico

```python
import requests

response = requests.post(
    "http://127.0.0.1:8080/synthesize",
    json={"text": "Olá, mundo!"}
)

with open("audio.wav", "wb") as f:
    f.write(response.content)

print("✅ Áudio salvo em audio.wav")
```

### Exemplo 2: Com verificação de erro

```python
import requests

text = "Este é um exemplo com verificação de erro"

response = requests.post(
    "http://127.0.0.1:8080/synthesize",
    json={"text": text},
    timeout=60
)

if response.status_code == 200:
    with open("audio.wav", "wb") as f:
        f.write(response.content)
    print(f"✅ Áudio gerado: {len(response.content)} bytes")
else:
    print(f"❌ Erro: {response.status_code}")
    print(response.json())
```

### Exemplo 3: Múltiplas sínteses

```python
import requests

textos = [
    "Primeira síntese",
    "Segunda síntese",
    "Terceira síntese"
]

for i, texto in enumerate(textos, 1):
    response = requests.post(
        "http://127.0.0.1:8080/synthesize",
        json={"text": texto}
    )
    
    filename = f"audio_{i}.wav"
    with open(filename, "wb") as f:
        f.write(response.content)
    
    print(f"✅ {filename} ({len(response.content)} bytes)")
```

## 🔧 Estrutura de Arquivos

```
piper/
├── main.py                          # API FastAPI
├── client.py                        # Cliente Python
├── test_api.py                      # Testes automatizados
├── piper.exe                        # Executável Piper
├── pt_BR-faber-medium.onnx         # Modelo de voz português
├── pt_BR-faber-medium.onnx.json    # Config do modelo
├── espeak-ng-data/                 # Dados linguísticos
└── .venv/                          # Ambiente virtual Python
```

## 📊 Troubleshooting

### Erro: "Port 8080 already in use"

```bash
# Mude a porta em main.py
# ou: killall python (Windows: taskkill /F /IM python.exe)
```

### Erro: "Piper não encontrado"

Certifique-se que `piper.exe` está no diretório raiz do projeto.

### Erro: "Binary file responses are supported only in the paid version"

Use **Python client** em vez de Postman/Insomnia gratuito:
```bash
python client.py "Seu texto"
```

## 📝 Notas

- Textos muito longos (>5000 caracteres) são rejeitados
- Primeira síntese leva um pouco mais (carregamento do modelo)
- Sinteses subsequentes são mais rápidas
- Áudio é retornado em formato WAV 22kHz mono

## 🎯 Próximas melhorias

- [ ] Suporte a múltiplos idiomas
- [ ] Cache de sínteses
- [ ] Batch processing
- [ ] WebSocket para streaming em tempo real
- [ ] Docker deployment

## 📄 Licença

MIT - Livre para uso e modificação

---

**Desenvolvido com ❤️ usando Piper TTS e FastAPI**
