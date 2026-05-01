import re
import os
from pydub import AudioSegment, effects

def limpar_texto(texto: str) -> str:
    """
    Limpa o texto para evitar que o modelo verbalize pontuações de forma literal.
    Remove emojis, espaços antes de pontuação, reduz múltiplos pontos e garante um ponto final.
    """
    # Remove emojis e caracteres especiais de alta ordem Unicode
    texto = re.sub(r'[\U00010000-\U0010ffff]|[\u2600-\u27ff]', '', texto)

    # Remove espaços antes de pontuações (ex: "olá ." -> "olá.")
    texto = re.sub(r'\s+([\.!\?,])', r'\1', texto) 
    
    # Substitui múltiplos pontos por apenas um
    texto = re.sub(r'\.{2,}', '.', texto)     
    
    # Normaliza espaços extras
    texto = re.sub(r'\s+', ' ', texto)        
    
    texto = texto.strip()
    
    # Garante que termine com um ponto se não tiver pontuação final para manter a prosódia
    if texto and not texto.endswith(('.', '!', '?')):
        texto += '.'
    
    # Remove quebras de linha que podem atrapalhar o XTTS
    texto = texto.replace('\n', ' ')
    
    return texto

def processar_audio(caminho_entrada: str, caminho_saida: str):
    """
    Aplica normalização e filtros de áudio para melhorar a qualidade.
    """
    if not os.path.exists(caminho_entrada):
        return
        
    audio = AudioSegment.from_wav(caminho_entrada)
    
    # Normalização de volume
    audio = effects.normalize(audio)
    
    # Filtros para limpeza de ruído (HPF e LPF)
    audio = audio.high_pass_filter(80)
    audio = audio.low_pass_filter(7500)
    
    audio.export(caminho_saida, format="wav")
