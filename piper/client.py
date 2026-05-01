"""
Cliente Python para a API Piper Voice
Sem limitações - funciona perfeitamente!
"""

import requests
import sys
from pathlib import Path
from datetime import datetime

BASE_URL = "http://127.0.0.1:8080"

def synthesize_and_save(text, output_file=None):
    """
    Sintetiza texto e salva o áudio
    
    Args:
        text: Texto a ser sintetizado
        output_file: Caminho do arquivo de saída (padrão: timestamp.wav)
    
    Returns:
        Caminho do arquivo salvo
    """
    if output_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"audio_{timestamp}.wav"
    
    print(f"📝 Texto: {text[:50]}..." if len(text) > 50 else f"📝 Texto: {text}")
    print(f"🔄 Sintetizando...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/synthesize",
            json={"text": text},
            timeout=60
        )
        
        if response.status_code == 200:
            # Salva o arquivo
            with open(output_file, "wb") as f:
                f.write(response.content)
            
            file_size = len(response.content)
            print(f"✅ Sucesso!")
            print(f"📁 Arquivo: {output_file}")
            print(f"💾 Tamanho: {file_size:,} bytes ({file_size/1024:.1f} KB)")
            print()
            return output_file
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
            return None
    
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

def main():
    """Menu interativo"""
    print("=" * 60)
    print("🎤 Piper Voice API - Cliente Python")
    print("=" * 60)
    print()
    
    textos_exemplo = [
        "Olá, tudo bem? Este é um teste da API de síntese de voz.",
        "A inteligência artificial está transformando o mundo.",
        "Python é uma linguagem de programação poderosa e versátil.",
        "O Piper é um gerador de voz offline de alta qualidade.",
    ]
    
    while True:
        print("Opções:")
        print("1. Testar com textos de exemplo")
        print("2. Digite seu próprio texto")
        print("3. Sair")
        print()
        
        choice = input("Escolha uma opção (1-3): ").strip()
        
        if choice == "1":
            for i, texto in enumerate(textos_exemplo, 1):
                print(f"\n[{i}/{len(textos_exemplo)}]")
                output_file = f"exemplo_{i}.wav"
                synthesize_and_save(texto, output_file)
        
        elif choice == "2":
            texto = input("\nDigite o texto a ser sintetizado: ").strip()
            if texto:
                synthesize_and_save(texto)
            else:
                print("❌ Texto vazio!")
        
        elif choice == "3":
            print("\n👋 Até logo!")
            break
        
        else:
            print("❌ Opção inválida!")
        
        print()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Se passar argumento via linha de comando
        texto = " ".join(sys.argv[1:])
        synthesize_and_save(texto)
    else:
        # Modo interativo
        main()
