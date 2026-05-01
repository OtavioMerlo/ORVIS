# Clonagem de Voz Jarvis - XTTS v2

Este projeto foi otimizado para oferecer clonagem de voz rápida, precisa e com melhor organização.

## Estrutura do Projeto

- `api.py`: Servidor FastAPI que mantém o modelo carregado na memória.
- `main.py`: Script simples para geração manual sem API.
- `utils/`: Contém ferramentas para limpeza de texto e processamento de áudio.
- `vozes/`: Pasta onde você deve colocar os áudios `.wav` de referência (vozes a serem clonadas).
- `outputs/`: Pasta onde os áudios gerados pela API são salvos.
- `learning_list/`: Pasta para os áudios que você aprovou como de alta qualidade.

## Melhorias Realizadas

1.  **Correção de Dependências**: Corrigido o erro de `ImportError` e versão do PyTorch para garantir estabilidade no Windows.
2.  **Organização Total**: Código modularizado com comentários 100% em português.
3.  **Fim da Fala de Pontuação**: O sistema limpa o texto antes da geração, garantindo que o modelo não fale "ponto" no final das frases.
4.  **Velocidade**: Modelo carregado uma única vez na API, economizando tempo em cada geração.
5.  **Lista de Aprendizado**: Sistema de feedback inteligente que move os melhores áudios e guarda seus metadados.

## Como Usar

### 1. Iniciar o Servidor (Recomendado)
```bash
python api.py
```

### 2. Testar a Geração
Abra outro terminal e rode:
```bash
python test_api.py
```

### 3. Usar sem API
```bash
python main.py
```

## Endpoints da API

- **Gerar Áudio**: `POST /generate`
- **Enviar Feedback**: `POST /feedback`
- **Saúde do Sistema**: `GET /`

---
*Dica: Caso queira clonar uma nova voz, basta jogar o arquivo .wav na pasta `vozes` e reiniciar a API.*
