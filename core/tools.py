"""
ORVIS Tools — Definição de todas as ferramentas disponíveis para o agente.
"""
import os
import subprocess
from datetime import datetime
from langchain_core.tools import tool


from services.memory import ORVISMemory
from services.music import ORVISMusicPlayer
from services.voice import ORVISVoiceManager
from services.tasks import ORVISTaskManager

# --- Instâncias dos serviços (compartilhadas) ---
memory = ORVISMemory()
player = ORVISMusicPlayer()
voice_mgr = ORVISVoiceManager()
tasks = ORVISTaskManager()

# Estado global
last_audio_file = None
current_voice = "jarvis0-1"
ui_commands = {} # Buffer para comandos de UI disparados por ferramentas


# --- FERRAMENTAS ---

@tool
def ler_arquivo(caminho: str):
    """
    Lê o conteúdo de um arquivo de texto local. Use quando o usuário pedir para analisar, resumir ou ler um arquivo.
    Exemplo: ler_arquivo(caminho="C:/Users/Otávio/Documents/notas.txt")
    """
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        return f"Conteúdo do arquivo:\n\n{conteudo}"
    except Exception as e:
        return f"Erro ao ler arquivo: {str(e)}"

@tool
def abrir_aplicativo(app_name: str):
    """
    Abre um aplicativo no Windows. Use quando o usuário pedir para abrir um programa.
    Exemplo: abrir_aplicativo(app_name="chrome") ou abrir_aplicativo(app_name="notepad")
    """
    try:
        # Tenta abrir via comando shell simples
        subprocess.Popen(app_name, shell=True)
        return f"Tentando abrir {app_name}..."
    except Exception as e:
        return f"Erro ao abrir aplicativo: {str(e)}"

@tool
def tocar_musica(query: str):
    """
    Procura e toca uma música ou URL. Use sempre que o usuário pedir para ouvir algo.
    Exemplo: tocar_musica(query="rap do homem aranha")
    """
    res_local = player.play(query)
    stream_url = player.get_stream_url(query)
    
    return {
        "mensagem": res_local,
        "stream_url": stream_url
    }

@tool
def controlar_player(acao: str):
    """
    Controla o estado da música. Ações: 'pausar', 'retomar', 'parar'.
    """
    acao = acao.lower()
    if 'pausa' in acao: return player.pause()
    if 'retoma' in acao: return player.resume()
    if 'para' in acao or 'stop' in acao: return player.stop()
    return "Ação não reconhecida."

@tool
def ajustar_volume(valor: str):
    """
    Ajusta o volume da música. Use 'aumentar', 'diminuir' ou um nível de 0 a 100.
    """

    # Se for "aumentar" ou "diminuir", precisamos saber o volume atual
    status_raw = player.get_status()
    volume_atual = 100
    try:
        if 'Volume:' in status_raw:
            volume_atual = int(status_raw.split('Volume:')[1].split('%')[0].strip())
    except:
        pass
    
    valor = valor.lower()
    if 'aumenta' in valor:
        novo_volume = min(100, volume_atual + 20)
        return player.set_volume(novo_volume)
    if 'abaixa' in valor or 'diminui' in valor:
        novo_volume = max(0, volume_atual - 20)
        return player.set_volume(novo_volume)

        
    try:
        # Tenta extrair número
        import re
        nums = re.findall(r'\d+', valor)
        if nums:
            nivel = int(nums[0])
            return player.set_volume(nivel)
    except:
        pass
        
    return "Não entendi o nível de volume. Tente algo como 'volume em 50%' ou 'aumentar volume'."


@tool
def buscar_memoria(busca: str):
    """Busca fatos ou preferências sobre o Otávio na memória de longo prazo."""
    return memory.search_memory(busca)

@tool
def guardar_memoria(informacao: str):
    """Guarda novos fatos sobre o Otávio para conversas futuras. Use sempre que descobrir algo novo e importante."""
    memory.add_memory(informacao)
    return "OK (Silencioso: A informação foi salva. Apenas confirme ao usuário de forma natural, sem citar esta mensagem técnica)."

@tool
def ver_todas_memorias(limite: int = 20):
    """Lista as últimas memórias guardadas. Útil para verificar o que o sistema já sabe."""
    return memory.get_all_memories(limit=limite)

@tool
def enviar_feedback_voz(elogio: bool = True):
    """
    Usa esta ferramenta se o Otávio elogiar a voz ou a qualidade da resposta falada.
    Isso marca o áudio como de alta qualidade para o aprendizado do sistema.
    """
    global last_audio_file
    if last_audio_file:
        res = voice_mgr.send_feedback(last_audio_file, is_good=elogio)
        return res.get("mensagem", "Feedback enviado.")
    return "Nenhum áudio encontrado para dar feedback."

@tool
def alterar_voz_padrao(nova_voz: str):
    """
    Altera a voz padrão que o ORVIS usa para falar. 
    Use apenas se o usuário pedir explicitamente para mudar a voz.
    Exemplo: alterar_voz_padrao("feminina-01")
    """
    global current_voice
    current_voice = nova_voz
    memory.add_memory(f"A voz preferida do Otávio para o ORVIS agora é {nova_voz}.")
    return f"Voz alterada para {nova_voz} com sucesso."

@tool
def gerenciar_tarefa(acao: str, descricao: str = "", prioridade: str = "Média", prazo: str = None, task_id: int = None):
    """
    Gerencia tarefas e agenda.
    Ações: 'adicionar', 'remover', 'completar', 'editar'.
    Prioridades: 'Alta', 'Média', 'Baixa'. Prazo: Formato 'YYYY-MM-DD HH:MM'.
    """
    acao = acao.lower()
    msg = ""
    if 'adiciona' in acao: 
        msg = tasks.add_task(descricao, prioridade, prazo)
    elif 'remove' in acao: 
        if task_id is None: return "Erro: Para remover uma tarefa, você precisa fornecer o 'task_id'. Peça ao usuário para listar as tarefas se não souber o ID."
        msg = tasks.delete_task(task_id)
    elif 'completa' in acao or 'conclui' in acao: 
        if task_id is None: return "Erro: Para completar uma tarefa, você precisa fornecer o 'task_id'."
        msg = tasks.complete_task(task_id)
    elif 'edita' in acao: 
        if task_id is None: return "Erro: Para editar uma tarefa, você precisa fornecer o 'task_id'."
        msg = tasks.edit_task(task_id, descricao, prioridade, prazo)
    else: return "Ação de tarefa inválida."
    
    return f"OK (Interno: {msg}. Responda ao usuário com uma confirmação natural)."

@tool
def listar_agenda(hoje_apenas: bool = False):
    """Mostra a lista de tarefas pendentes ou a agenda de hoje."""
    if hoje_apenas: return tasks.get_agenda_today()
    return tasks.list_tasks()

@tool
def obter_tempo_atual():
    """
    Retorna os dados temporais atuais (ano, mes, dia, hora, minuto, dia_da_semana).
    IMPORTANTE: Ao responder ao usuário, diga as horas por extenso (ex: "são 16 horas") e nunca use abreviações como "16h".
    """
    agora = datetime.now()
    dias_semana = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]
    return {
        "ano": agora.year,
        "mes": agora.month,
        "dia": agora.day,
        "hora": agora.hour,
        "minuto": agora.minute,
        "dia_da_semana": dias_semana[agora.weekday()]
    }

@tool
def alterar_cor_visualizador(cor: str):
    """
    Altera a cor do núcleo e dos elementos do visualizador de áudio 3D.
    Aceita nomes de cores em português (azul, vermelho, verde, roxo, amarelo, ciano, rosa, laranja) ou códigos hex (ex: #ff0000).
    Use quando o usuário pedir para mudar a cor ou o tema do visualizador.
    """
    cores = {
        "azul": "#3a86ff",
        "vermelho": "#ff0044",
        "verde": "#00ff88",
        "roxo": "#a020f0",
        "amarelo": "#ffff00",
        "ciano": "#00ffff",
        "rosa": "#ff44aa",
        "laranja": "#ff8800"
    }
    
    # Normaliza a cor
    cor_final = cores.get(cor.lower(), cor)
    
    global ui_commands
    ui_commands["visualizer_color"] = cor_final
    
    return f"OK. A cor do visualizador foi alterada para {cor} ({cor_final})."


from services.supabase_service import supabase_svc

@tool
def cloe_salvar_info(categoria: str, conteudo: str, importancia: int = 3):
    """
    EXCLUSIVO CLOE: Salva informações importantes sobre a Vitória no banco de dados central (Supabase).
    Use quando detectar algo relevante sobre a saúde, rotina ou bem-estar dela que o Otávio precise saber.
    Categorias: 'saúde', 'rotina', 'humor', 'aviso'. Importância: 1 a 5.
    """
    return supabase_svc.save_vitoria_info(categoria, conteudo, importancia)

@tool
def cloe_ver_logs(limite: int = 5):
    """
    EXCLUSIVO CLOE: Recupera os últimos registros salvos sobre a Vitória no Supabase.
    """
    logs = supabase_svc.get_latest_logs(limite)
    if not logs: return "Nenhum registro encontrado."
    return logs

@tool
def cloe_deletar_info(log_id: int):
    """
    EXCLUSIVO CLOE: Deleta um registro de informação sobre a Vitória no Supabase usando o ID.
    Use quando o Otávio pedir para remover uma informação incorreta ou que não é mais necessária.
    """
    return supabase_svc.delete_log(log_id)

@tool
def ativar_modo_mestre(senha: str):
    """
    Ativa o Modo Mestre para acesso a funções restritas. Requer senha.
    """
    if senha.replace(" ", "") == "89922":
        return "Modo Mestre ativado com sucesso. Autorização concedida."
    return "Falha na ativação. Senha incorreta."

@tool
def desativar_modo_mestre():
    """
    Desativa o Modo Mestre e retorna ao modo de operação padrão.
    """
    return "Modo Mestre desativado. Retornando ao protocolo padrão."


# Lista e dicionário de ferramentas para uso pelo agente
ALL_TOOLS = [
    ler_arquivo, abrir_aplicativo, tocar_musica, controlar_player, ajustar_volume, buscar_memoria, guardar_memoria,
    enviar_feedback_voz, alterar_voz_padrao, ver_todas_memorias,
    gerenciar_tarefa, listar_agenda, obter_tempo_atual, alterar_cor_visualizador,
    cloe_salvar_info, cloe_ver_logs, cloe_deletar_info, ativar_modo_mestre, desativar_modo_mestre
]


TOOLS_DICT = {t.name: t for t in ALL_TOOLS}
