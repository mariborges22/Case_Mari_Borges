# scripts/chaos-runner.ps1
$ApiUrl = "http://localhost:3000/api/v1"

Write-Host "--- Iniciando Teste Final: Alta Concorrência e Resiliência ---" -ForegroundColor Cyan

# 1. Obter Token e Link ID
Write-Host "Preparando ambiente..."
$loginBody = @{ email = "jose@teste.com"; password = "password123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method Post -Uri "$ApiUrl/users/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.token

$projBody = @{ name = "Stress Test Project" } | ConvertTo-Json
$headers = @{ Authorization = "Bearer $token" }
$project = Invoke-RestMethod -Method Post -Uri "$ApiUrl/projects" -Headers $headers -ContentType "application/json" -Body $projBody

$linkBody = @{ name = "Stress Link"; baseUrl = "https://google.com"; projectId = $project.id; parameters = @() } | ConvertTo-Json
$link = Invoke-RestMethod -Method Post -Uri "$ApiUrl/links" -Headers $headers -ContentType "application/json" -Body $linkBody
$linkId = $link.id

Write-Host "Setup OK. Link ID: $linkId" -ForegroundColor Green

# 2. Roda o k6 no primeiro plano (Sem quebrar o .env desta vez)
Write-Host "Iniciando k6 com 50 Usuários Simultâneos..." -ForegroundColor Magenta
k6 run --env LINK_ID=$linkId --env TOKEN=$token scripts/concurrency-test.js

Write-Host "--- Experimento Concluído ---" -ForegroundColor Cyan
