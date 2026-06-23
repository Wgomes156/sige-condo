# CondoPlus (sige-condo) - Backup Supabase -> PostgreSQL Local
# Uso: powershell -ExecutionPolicy Bypass -File "D:\sige-condo\backup-sync-condoplus.ps1"

# ── CONFIGURACOES ──────────────────────────────────────────────────────────────
$SUPA_HOST  = "db.efmfyuewgtejsmwiusgn.supabase.co"
$SUPA_PORT  = "5432"
$SUPA_DB    = "postgres"
$SUPA_USER  = "postgres"
$SUPA_PASS  = "7P3iJWm1POnpEaij"

$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_DB   = "condoplus_backup"
$LOCAL_USER = "postgres"
$LOCAL_PASS = "Psc561"

$BACKUP_DIR = "D:\sige-condo\backups"
$KEEP_DAYS  = 7
$PG_BIN     = "C:\Program Files\PostgreSQL\18\bin"
# ── FIM DAS CONFIGURACOES ──────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$dumpFile  = "$BACKUP_DIR\condoplus_$timestamp.sql"
$logFile   = "$BACKUP_DIR\backup.log"

if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Log "=== Iniciando backup CondoPlus ==="

# 1. DUMP do Supabase
# Resolver para IPv4 para evitar timeout em redes sem suporte a IPv6
$ipv4 = (Resolve-DnsName $SUPA_HOST -Type A -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
if ($ipv4) {
    Log "IPv4 resolvido: $ipv4"
    $SUPA_CONNECT = $ipv4
} else {
    Log "Usando hostname direto"
    $SUPA_CONNECT = $SUPA_HOST
}

Log "Exportando Supabase -> $dumpFile"
$env:PGPASSWORD = $SUPA_PASS

& "$PG_BIN\pg_dump.exe" `
    --host=$SUPA_CONNECT `
    --port=$SUPA_PORT `
    --username=$SUPA_USER `
    --dbname=$SUPA_DB `
    --schema=public `
    --no-owner `
    --no-acl `
    --format=plain `
    --file="$dumpFile"

if ($LASTEXITCODE -ne 0) {
    Log "ERRO: pg_dump falhou (exit $LASTEXITCODE)"
    exit 1
}

$sizeKB = [math]::Round((Get-Item $dumpFile).Length / 1KB, 0)
Log "Dump OK: $sizeKB KB"

# 2. Criar banco local se nao existir
$env:PGPASSWORD = $LOCAL_PASS

$dbExists = & "$PG_BIN\psql.exe" `
    -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER `
    -tAc "SELECT 1 FROM pg_database WHERE datname='$LOCAL_DB'" postgres

if ($dbExists -ne "1") {
    Log "Criando banco local '$LOCAL_DB'..."
    & "$PG_BIN\psql.exe" `
        -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER `
        -c "CREATE DATABASE $LOCAL_DB;" postgres
}

# 3. Limpar schema publico
Log "Limpando schema public..."
& "$PG_BIN\psql.exe" `
    -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB `
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" | Out-Null

# 4. Restaurar dump
Log "Restaurando dump no banco local '$LOCAL_DB'..."
& "$PG_BIN\psql.exe" `
    --host=$LOCAL_HOST `
    --port=$LOCAL_PORT `
    --username=$LOCAL_USER `
    --dbname=$LOCAL_DB `
    --file="$dumpFile" `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Log "AVISO: psql retornou exit $LASTEXITCODE (verifique se os dados foram importados)"
} else {
    Log "Restore concluido com sucesso."
}

# 5. Remover backups antigos
Log "Removendo backups com mais de $KEEP_DAYS dias..."
Get-ChildItem "$BACKUP_DIR\condoplus_*.sql" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KEEP_DAYS) } |
    ForEach-Object {
        Remove-Item $_.FullName
        Log "Removido: $($_.Name)"
    }

$env:PGPASSWORD = $LOCAL_PASS

# 6. Conceder acesso de leitura ao usuario pscadm
Log "Concedendo acesso ao usuario pscadm..."
$grantSql = "GRANT SELECT ON ALL TABLES IN SCHEMA public TO pscadm; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO pscadm;"
$grantSql | & "$PG_BIN\psql.exe" -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB | Out-Null
if ($LASTEXITCODE -eq 0) {
    Log "Acesso ao pscadm concedido com sucesso."
} else {
    Log "AVISO: Falha ao conceder acesso ao pscadm."
}

$env:PGPASSWORD = ""
Log "=== Backup finalizado: $dumpFile ==="
