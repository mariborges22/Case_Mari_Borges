<#
.SYNOPSIS
Instala a versão LTS mais recente da série 20.x do Node.js no Windows (sem winget).

.DESCRIPTION
1️⃣  Busca o JSON de versões oficiais do Node.js.  
2️⃣  Seleciona a primeira entrada que:
   • Começa com “v20.”  
   • Possui a flag `lts` (é LTS).  
3️⃣  Monta o URL do instalador MSI *x64*.  
4️⃣  Baixa o instalador, o executa silenciosamente e adiciona o diretório ao PATH (sessão + máquina).  
5️⃣  Valida a instalação e gera o `package-lock.json` opcionalmente.

> **⚠️ Necessário:** PowerShell *elevado* (Run as Administrator).  
> **⚙️ Requisitos:** conexão à internet.
#>

# -------------------------- CONFIGURAÇÕES --------------------------
$nodeMajor = 20                # Série que queremos (LTS atual em 2026)
$nodeArch = "x64"            # Arquitetura do instalador
$tempDir = "$env:TEMP\nodejs-install"
$installer = "$tempDir\nodejs.msi"
$downloadUrl = $null   # será preenchido dinamicamente

# -------------------------- FUNÇÕES -------------------------------
function Write-Info { Write-Host "[INFO]  $_" -ForegroundColor Cyan }
function Write-Error { Write-Host "[ERRO]  $_" -ForegroundColor Red }
function Write-Sucess { Write-Host "[OK]    $_" -ForegroundColor Green }

# -------------------------- PASSO 1 – BUSCA VERSÃO -----------------
Write-Info "Obtendo a lista de versões do Node.js ..."
try {
    $json = Invoke-WebRequest -Uri "https://nodejs.org/dist/index.json" `
        -UseBasicParsing -ErrorAction Stop |
    Select-Object -ExpandProperty Content |
    ConvertFrom-Json
}
catch {
    Write-Error "Não foi possível baixar o índice de versões. Verifique a conexão."
    exit 1
}

# Seleciona a última LTS da série 20.x
$latestLts = $json |
Where-Object { $_.version -like "v$nodeMajor.*" -and $_.lts } |
Select-Object -First 1

if (-not $latestLts) {
    Write-Error "Nenhuma versão LTS da série $nodeMajor.x foi encontrada."
    exit 1
}

$version = $latestLts.version.TrimStart('v')   # ex.: 20.17.0
$downloadUrl = "https://nodejs.org/dist/v$version/node-v$version-win-$nodeArch.msi"

Write-Sucess "Versão LTS encontrada: v$version"
Write-Info "URL do instalador: $downloadUrl"

# -------------------------- PREPARO -------------------------------
Write-Info "Criando diretório temporário $tempDir ..."
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# -------------------------- DOWNLOAD -----------------------------
Write-Info "Baixando instalador MSI ..."
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installer -UseBasicParsing -ErrorAction Stop
}
catch {
    Write-Error "Falha ao baixar o instalador. URL pode estar incorreta ou a conexão falhou."
    exit 1
}
Write-Sucess "Instalador salvo em $installer"

# -------------------------- INSTALAÇÃO ---------------------------
Write-Info "Executando instalador em modo silencioso ..."
# Parâmetros: /quiet → sem UI, /norestart → não reinicia automaticamente
$installArgs = "/i `"$installer`" /quiet /norestart"
$proc = Start-Process msiexec.exe -ArgumentList $installArgs -Wait -PassThru

if ($proc.ExitCode -ne 0) {
    Write-Error "Instalador retornou código $($proc.ExitCode). Abortando."
    exit $proc.ExitCode
}
Write-Sucess "Node.js instalado com sucesso."

# -------------------------- PATH -------------------------------
# Diretório padrão de instalação do MSI
$nodeDir = "C:\Program Files\nodejs"

if (-Not (Test-Path $nodeDir)) {
    Write-Error "Diretório esperado $nodeDir não encontrado. Verifique a instalação."
    exit 1
}

# 1) Atualiza PATH da sessão atual
$env:Path = "$nodeDir;$env:Path"
Write-Info "PATH da sessão atual atualizado."

# 2) Persiste PATH nas variáveis de sistema (necessário admin)
$machinePath = [Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::Machine)
if (-not ($machinePath -match [regex]::Escape($nodeDir))) {
    $newMachinePath = "$machinePath;$nodeDir"
    [Environment]::SetEnvironmentVariable('Path', $newMachinePath, [System.EnvironmentVariableTarget]::Machine)
    Write-Sucess "PATH permanente (variável de sistema) atualizado."
}
else {
    Write-Info "Diretório já presente no PATH permanente."
}

# -------------------------- VERIFICAÇÃO -------------------------
Write-Info "Validando versões instaladas..."
try {
    $nodeVer = & node -v
    $npmVer = & npm -v
    Write-Sucess "Node  $nodeVer"
    Write-Sucess "npm   $npmVer"
}
catch {
    Write-Error "Não foi possível executar 'node' ou 'npm' – talvez seja preciso abrir um novo PowerShell."
    exit 1
}

# -------------------------- LIMPEZA ----------------------------
Write-Info "Removendo arquivos temporários..."
Remove-Item -Recurse -Force $tempDir

Write-Sucess "`nInstalação concluída! 🎉"
Write-Host " • Para que o PATH seja reconhecido em novos terminais, abra um novo PowerShell ou reinicie o PC."
Write-Host " • Caso queira gerar o lock file do npm, execute:"
Write-Host "       npm install --package-lock-only"
