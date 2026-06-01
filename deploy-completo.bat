@echo off
cd /d "%~dp0"
echo ==========================================================
echo   ATUALIZANDO SISTEMA COMPLETO (VERCEL E FLY.IO)
echo ==========================================================
echo.

set /p msg="Digite a mensagem do que voce alterou (ex: corrigindo layout): "

if "%msg%"=="" (
    set msg=Atualizacao do sistema
)

echo.
echo [1/3] Preparando arquivos locais...
git add .

echo.
echo [2/3] Enviando para o GitHub (Atualiza o Vercel automaticamente)...
git commit -m "%msg%"
git push origin main

echo.
echo [3/3] Atualizando servidor Backend (Fly.io)...
"C:\Users\RUAN CPA\.fly\bin\flyctl.exe" deploy

echo.
echo ==========================================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ==========================================================
echo.
pause
