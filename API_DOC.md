# 📚 Documentação da API ORVIS

A API do ORVIS permite que você conecte o cérebro do assistente a qualquer aplicação (Web, Mobile, Node-RED, etc).

**Porta Padrão:** `8080`
**Formato das Mensagens:** `JSON`

---

## 💬 Chat (O Cérebro)

Interage com o agente, usa ferramentas e memória.

- **URL:** `POST /chat`
- **Body:**
```json
{
  "message": "Sua pergunta aqui",
  "session_id": "nome_do_seu_app",
  "generate_audio": false,
  "voice": "jarvis0-1"
}
```
- **Obs:** O `session_id` mantém o histórico da conversa vivo para aquele app específico.

---

## 📅 Tarefas (Agenda)

- **Listar:** `GET /tasks`
- **Criar:** `POST /tasks` (Body: `{"descricao": "...", "prioridade": "Alta"}`)
- **Concluir:** `PATCH /tasks/{id}/complete`
- **Deletar:** `DELETE /tasks/{id}`

---

## 🧠 Memória (RAG)

- **Buscar:** `GET /memory/search?q=termo_de_busca`
- **Adicionar:** `POST /memory` (Body: `{"informacao": "..."}`)

---

## 🛠️ Status do Sistema

- **URL:** `GET /health` -> Verifica se o Groq e os sistemas de dados estão online.
- **URL:** `GET /time` -> Retorna a hora estruturada.

---

## 🚀 Interface Visual de Teste (Swagger)
Acesse no seu navegador enquanto a API estiver rodando:
[http://localhost:8080/docs](http://localhost:8080/docs)
