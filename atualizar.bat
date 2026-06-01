@echo off
set "mensagem=%~1"
if "%mensagem%"=="" set "mensagem=Atualizacao do projeto"

echo =========================================
echo   Subindo atualizacao para o GitHub...
echo =========================================

git add .
git commit -m "%mensagem%"
git push origin main

echo =========================================
echo   Atualizacao enviada com sucesso!
echo =========================================
echo.
echo -^> Vercel (Frontend): O build vai iniciar automaticamente pelo GitHub.
echo -^> Fly.io (Backend): Se nao configurou o GitHub Actions para o Fly, rode o comando: fly deploy
