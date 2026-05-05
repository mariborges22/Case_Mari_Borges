# scripts/hardware-chaos.ps1
$ApiUrl = "http://localhost:3000/api/v1"

Write-Host "--- Iniciando Caos de Hardware: Exaustão de Recursos ---" -ForegroundColor Red

for ($i = 1; $i -le 10; $i++) {
    Write-Host "Injeção #$($i): Vazando 50MB de RAM..." -ForegroundColor Yellow
    try {
        $res = Invoke-RestMethod -Method Get -Uri "$ApiUrl/chaos/memory-leak?size=50"
        Write-Host "Memória atual no Node: $($res.currentRSS)" -ForegroundColor White
        
        # Verifica se a API ainda responde rápido
        $sw = [Diagnostics.Stopwatch]::StartNew()
        Invoke-RestMethod -Method Get -Uri "$ApiUrl/metrics" | Out-Null
        $sw.Stop()
        Write-Host "Latência da API: $($sw.Elapsed.TotalMilliseconds)ms" -ForegroundColor Cyan
    } catch {
        Write-Host "!!! API PAROU DE RESPONDER (OOM?) !!!" -ForegroundColor Red
        break
    }
    Start-Sleep -Seconds 2
}

Write-Host "--- Experimento Concluído ---"
