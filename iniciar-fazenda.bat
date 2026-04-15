@echo off
title Fazenda - Controle de Rebanho
echo ========================================
echo   Fazenda - Controle de Rebanho
echo ========================================
echo.
echo Iniciando servidor...
echo.

cd /d "%~dp0"

:: Mata processos anteriores na porta 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: Inicia o backend (serve o frontend buildado tambem)
start /min cmd /c "node server/index.js"

:: Aguarda o servidor subir
timeout /t 2 /nobreak >nul

:: Abre no navegador
start "" "http://localhost:3001"

:: Inicia tunel Cloudflare para compartilhamento
set CF_PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe
if exist "%CF_PATH%" (
    echo.
    echo Iniciando tunel para compartilhamento...
    start /min cmd /c ""%CF_PATH%" tunnel --url http://localhost:3001"
    echo Tunel Cloudflare ativo! Verifique a URL no terminal minimizado.
)

echo.
echo Servidor rodando em http://localhost:3001
echo Feche esta janela para parar o servidor.
pause
