import requests
import json

# URL base da API
BASE_URL = "http://localhost:8000"

def gerar_audio(texto, voz="jarvis0-1"):
    """Envia um pedido de geração para a API."""
    print(f"\n--- Gerando áudio para: {texto} (Voz: {voz}) ---")
    
    dados = {
        "texto": texto,
        "voz": voz,  # Passa o nome da pasta de voz
        "velocidade": 1.5,
        "temperatura": 0.5
    }
    
    try:
        response = requests.post(f"{BASE_URL}/generate", json=dados)
        if response.status_code == 200:
            info = response.json()
            print(f"Sucesso! Arquivo gerado: {info['arquivo']}")
            return info['arquivo']
        else:
            print(f"Erro na API: {response.text}")
            return None
    except Exception as e:
        print(f"Erro ao conectar com a API: {e}")
        return None

def enviar_feedback(nome_arquivo, aprovado=True):
    """Envia o feedback de qualidade para a API."""
    print(f"Enviando feedback para {nome_arquivo}...")
    
    dados = {
        "arquivo": nome_arquivo,
        "e_bom": aprovado
    }
    
    try:
        response = requests.post(f"{BASE_URL}/feedback", json=dados)
        print(f"Resposta: {response.json().get('mensagem')}")
    except Exception as e:
        print(f"Erro ao enviar feedback: {e}")

if __name__ == "__main__":
    print("Iniciando teste da API de Voz...")
    
    # 1. Tenta gerar um áudio escolhendo a voz (pasta)
    voz_escolhida = input("Qual voz deseja usar? (Ex: jarvis0-1, tavin): ") or "jarvis0-1"
    texto_teste = "Sistemas online. Estou pronto para ajudar, senhor."
    arquivo = gerar_audio(texto_teste, voz_escolhida)
    
    if arquivo:
        # 2. Pergunta se o usuário gostou
        opcao = input("\nO áudio ficou bom? Deseja salvar na lista de aprendizado? (s/n): ")
        if opcao.lower() == 's':
            enviar_feedback(arquivo, True)
        else:
            enviar_feedback(arquivo, False)
