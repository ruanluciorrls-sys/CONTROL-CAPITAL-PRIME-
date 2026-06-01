param(
    [string]$mensagem = "Atualizacao do projeto"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Subindo atualizacao para o GitHub..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

git add .
git commit -m $mensagem
git push origin main

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Atualizacao enviada com sucesso!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "-> Vercel (Frontend): O build vai iniciar automaticamente pelo GitHub." -ForegroundColor Yellow
Write-Host "-> Fly.io (Backend): Se nao configurou o GitHub Actions para o Fly, rode o comando: fly deploy" -ForegroundColor Yellow
