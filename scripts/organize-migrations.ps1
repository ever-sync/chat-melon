# Script para organizar migrations temporárias
# Move arquivos de fix e temporários para supabase/migrations/fixes/

$migrationsPath = "supabase\migrations"
$fixesPath = "supabase\migrations\fixes"

# Garantir que a pasta fixes existe
if (-not (Test-Path $fixesPath)) {
    New-Item -ItemType Directory -Path $fixesPath -Force | Out-Null
}

# Padrões de arquivos a mover
$patterns = @(
    "FIX_*.sql",
    "APPLY_*.sql",
    "fix_*.sql",
    "SQL_*.sql",
    "disable-*.sql",
    "final-*.sql",
    "get_*.sql",
    "test_*.sql",
    "temp_*.sql",
    "relatorios-*.sql",
    "inspect_*.sql",
    "verify_*.sql",
    "validate_*.sql",
    "simple-*.sql",
    "insert-*.sql",
    "recreate-*.sql",
    "fix-*.sql",
    "supreme_*.sql"
)

$movedCount = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path $migrationsPath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Move-Item -Path $file.FullName -Destination $fixesPath -Force
            Write-Host "Movido: $($file.Name)" -ForegroundColor Green
            $movedCount++
        }
        catch {
            Write-Host "Erro ao mover $($file.Name): $_" -ForegroundColor Red
        }
    }
}

Write-Host "`nTotal de arquivos movidos: $movedCount" -ForegroundColor Cyan

