
import os
import re
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from datetime import datetime


from core.tools import ALL_TOOLS, TOOLS_DICT, current_voice

load_dotenv()

# --- Configuração do LLM ---

api_key = os.getenv("online2")
is_local = os.getenv("local") == "1"

if not is_local:
    # Usando modelo compatível com Groq
    llm = ChatGroq(
        model_name="qwen/qwen3-32b",
        groq_api_key=api_key,
        temperature=0
    )
else:
    llm = ChatOllama(model="llama3.1", temperature=0.1)

# Bind tools
llm_with_tools = llm.bind_tools(ALL_TOOLS)


def get_system_prompt(personality: str = "orvis"):
    """Gera o system prompt carregando de arquivos externos em core/prompts/."""
    from core.tools import current_voice
    
    # Caminho base para os prompts
    base_path = os.path.join(os.path.dirname(__file__), "prompts")
    
    if personality.lower() == "cloe":
        file_path = os.path.join(base_path, "cloe.txt")
        if not os.path.exists(file_path):
            return SystemMessage(content="Você é Cloe, assistente virtual.")
        
        with open(file_path, "r", encoding="utf-8") as f:
            prompt_text = f.read()
        return SystemMessage(content=prompt_text.replace("{current_voice}", current_voice))

    # Prompt Padrão (ORVIS)
    file_path = os.path.join(base_path, "orvis.txt")
    if not os.path.exists(file_path):
        return SystemMessage(content="Você é ORVIS, inteligência artificial suprema.")
    
    with open(file_path, "r", encoding="utf-8") as f:
        prompt_text = f.read()
    
    return SystemMessage(content=prompt_text.replace("{current_voice}", current_voice))


def orvis_agent(user_input, chat_history, personality: str = "orvis"):
    """Executa o agente ORVIS/CLOE com suporte a ferramentas e fallbacks."""
    system_msg = get_system_prompt(personality)

    messages = [system_msg]
    messages.extend(chat_history)
    messages.append(HumanMessage(content=user_input))

    for _ in range(5):
        try:
            response = llm_with_tools.invoke(messages)
            messages.append(response)

            # 1. Chamadas de Ferramentas Nativas (LangChain)
            if response.tool_calls:
                for tool_call in response.tool_calls:
                    name = tool_call["name"]
                    args = tool_call["args"]

                    if name in TOOLS_DICT:
                        print(f"🛠️ Executando ferramenta (nativa): {name}...")
                        output = TOOLS_DICT[name].invoke(args)
                        messages.append(ToolMessage(content=str(output), tool_call_id=tool_call["id"]))
                    else:
                        messages.append(ToolMessage(content="Erro: Ferramenta não encontrada.", tool_call_id=tool_call["id"]))
                continue # Volta para o loop para o LLM processar os resultados

            # 2. Fallback: Detecção de JSON ou Tags no texto (Para modelos que "alucinam" o formato)
            content = response.content or ""
            
            # Busca por blocos JSON no texto (Regex gananciosa para pegar do primeiro { ao último })
            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
            if json_match:
                try:
                    raw_json = json_match.group(1)
                    # Limpeza básica se houver markdown
                    raw_json = raw_json.replace("```json", "").replace("```", "").strip()
                    tool_data = json.loads(raw_json)
                    
                    name = tool_data.get("name")
                    args = tool_data.get("arguments") or tool_data.get("parameters") or tool_data.get("args")
                    
                    if name in TOOLS_DICT:
                        print(f"🛠️ Executando ferramenta (fallback JSON): {name}...")
                        output = TOOLS_DICT[name].invoke(args)
                        messages.append(ToolMessage(content=str(output), tool_call_id="fallback_json"))
                        continue
                except Exception as e:
                    print(f"⚠️ Falha ao parsear JSON de fallback: {e}")
                    pass

            # Busca por formato <function=nome{JSON}></function>
            tag_match = re.search(r'<function=(\w+)({.*?})>', content)
            if tag_match:
                try:
                    name = tag_match.group(1)
                    args = json.loads(tag_match.group(2))
                    if name in TOOLS_DICT:
                        print(f"🛠️ Executando ferramenta (fallback TAG): {name}...")
                        output = TOOLS_DICT[name].invoke(args)
                        messages.append(ToolMessage(content=str(output), tool_call_id="fallback_tag"))
                        continue
                except:
                    pass

            # Se não houver chamadas detectadas, retorna a resposta final
            text_response = content or "Não entendi, pode repetir?"
            
            # Busca se alguma ferramenta de música deixou uma URL no histórico recente
            music_url = None
            for m in reversed(messages):
                if isinstance(m, ToolMessage) and "stream_url" in m.content:
                    try:
                        # Tenta extrair a URL se o conteúdo for um dict em string
                        import ast
                        data = ast.literal_eval(m.content)
                        music_url = data.get("stream_url")
                        break
                    except: pass

            return {
                "content": text_response,
                "music_url": music_url
            }
        except Exception as e:
            error_msg = str(e)
            with open("agent_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- ERROR {datetime.now()} ---\n")
                f.write(f"Input: {user_input}\n")
                f.write(f"Error: {error_msg}\n")
                f.write(f"Messages: {messages}\n")
            
            print(f"❌ Erro no Agente: {error_msg}")
            if "tool_use_failed" in error_msg or "400" in error_msg:
                return {
                    "content": f"Tive um problema técnico ao tentar processar isso (Error 400), Otávio. Pode repetir o pedido?",
                    "music_url": None
                }
            raise e



    # Resposta final fora do loop
    last_content = (messages[-1].content if messages and messages[-1].content else "Não consegui processar sua solicitação.")
    
    # Busca URL também no retorno final
    music_url = None
    for m in reversed(messages):
        if isinstance(m, ToolMessage) and "stream_url" in m.content:
            try:
                import ast
                data = ast.literal_eval(m.content)
                music_url = data.get("stream_url")
                break
            except: pass

    return {
        "content": last_content,
        "music_url": music_url
    }
