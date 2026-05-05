# simulate-traffic.ps1
$ApiUrl = "http://localhost:3000/api/v1"

Write-Host "--- Iniciando Simulação de Tráfego ---" -ForegroundColor Cyan

# 1. Registrar Usuário
Write-Host "1. Registrando usuário..."
$regBody = @{ name = "Jose"; email = "jose@teste.com"; password = "password123" } | ConvertTo-Json
$user = Invoke-RestMethod -Method Post -Uri "$ApiUrl/users/register" -ContentType "application/json" -Body $regBody
$user | Out-String

# 2. Login
Write-Host "2. Fazendo login..."
$loginBody = @{ email = "jose@teste.com"; password = "password123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method Post -Uri "$ApiUrl/users/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.token
Write-Host "Token obtido!" -ForegroundColor Green

# 3. Criar Projeto
Write-Host "3. Criando projeto..."
$projBody = @{ name = "Campanha Verão 2026" } | ConvertTo-Json
$headers = @{ Authorization = "Bearer $token" }
$project = Invoke-RestMethod -Method Post -Uri "$ApiUrl/projects" -Headers $headers -ContentType "application/json" -Body $projBody
$projectId = $project.id
Write-Host "Projeto criado: $projectId"

# 4. Criar Link Management
Write-Host "4. Criando link dinâmico..."
$linkBody = @{ 
    name = "Promo Facebook"
    baseUrl = "https://loja.com/produto"
    projectId = $projectId
    parameters = @(@{ key = "utm_source"; value = "facebook" })
} | ConvertTo-Json
$link = Invoke-RestMethod -Method Post -Uri "$ApiUrl/links" -Headers $headers -ContentType "application/json" -Body $linkBody
$linkId = $link.id
Write-Host "Link criado: $linkId"

# 5. Gerar Link (3 vezes)
Write-Host "5. Gerando link (3 vezes)..."
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Tentativa $i..."
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $res = Invoke-RestMethod -Method Get -Uri "$ApiUrl/links/$linkId/generate" -Headers $headers
    $sw.Stop()
    $res | Out-String
    Write-Host "Tempo: $($sw.Elapsed.TotalMilliseconds)ms" -ForegroundColor Yellow
}

# 6. Verificar Métricas
Write-Host "6. Verificando métricas de Observabilidade..." -ForegroundColor Cyan
$metrics = Invoke-RestMethod -Method Get -Uri "$ApiUrl/metrics"
$metrics -split "`n" | Select-String "http_request_duration_seconds_count|db_query_duration_seconds_count|redis_cache_requests_total"

Write-Host "--- Simulação Concluída ---" -ForegroundColor Green
