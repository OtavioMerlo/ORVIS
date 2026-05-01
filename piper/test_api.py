"""
Script para testar a API Piper Voice
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://127.0.0.1:8080"

def test_health():
    """Testa o endpoint de saúde"""
    print("\n=== Testando /health ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_voice_info():
    """Testa o endpoint de informações da voz"""
    print("\n=== Testando /voice/info ===")
    response = requests.get(f"{BASE_URL}/voice/info")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_synthesize():
    """Testa o endpoint de síntese"""
    print("\n=== Testando /synthesize ===")
    
    payload = {
        "text": "Olá, tudo bem? Este é um teste da API de síntese de voz."
    }
    
    print(f"Enviando: {json.dumps(payload, ensure_ascii=False)}")
    
    response = requests.post(
        f"{BASE_URL}/synthesize",
        json=payload,
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        # Salva o arquivo de áudio
        output_path = Path("output.wav")
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"✓ Áudio gerado e salvo em: {output_path}")
        print(f"  Tamanho: {len(response.content)} bytes")
        return True
    else:
        print(f"✗ Erro: {response.text}")
        return False

def test_info():
    """Testa o endpoint raiz"""
    print("\n=== Testando / ===")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    return response.status_code == 200

if __name__ == "__main__":
    print("=" * 50)
    print("Testando Piper Voice API")
    print("=" * 50)
    
    results = {
        "Health Check": test_health(),
        "Voice Info": test_voice_info(),
        "Root Info": test_info(),
        "Synthesize": test_synthesize()
    }
    
    print("\n" + "=" * 50)
    print("RESULTADOS DOS TESTES")
    print("=" * 50)
    
    for test_name, passed in results.items():
        status = "✓ PASSOU" if passed else "✗ FALHOU"
        print(f"{test_name}: {status}")
    
    print("=" * 50)
