@echo off
REM Script para iniciar a API Piper Voice no Windows

echo.
echo ========================================
echo   Piper Voice API - Iniciando...
echo ========================================
echo.

REM Ativa o ambiente virtual
call .venv\Scripts\activate.bat

REM Inicia o servidor
echo Iniciando servidor FastAPI...
echo Acesse: http://127.0.0.1:8080/docs
echo.
python main.py

pause
