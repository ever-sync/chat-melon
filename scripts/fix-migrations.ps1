# Script para corrigir migrations - adicionar IF NOT EXISTS em índices e tabelas

Write-Host "Corrigindo migrations..." -ForegroundColor Green

# Lista de arquivos para corrigir
$migrations = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql"

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $migrations) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $fileChanged = $false

    # 1. Corrigir CREATE INDEX sem IF NOT EXISTS
    if ($content -match "CREATE INDEX (?!IF NOT EXISTS)idx_") {
        $content = $content -replace "CREATE INDEX (idx_[^\s]+)", "CREATE INDEX IF NOT EXISTS `$1"
        $fileChanged = $true
        Write-Host "  - Corrigido indices em: $($file.Name)" -ForegroundColor Yellow
    }

    # 2. Corrigir CREATE UNIQUE INDEX sem IF NOT EXISTS
    if ($content -match "CREATE UNIQUE INDEX (?!IF NOT EXISTS)") {
        $content = $content -replace "CREATE UNIQUE INDEX ([^\s]+)", "CREATE UNIQUE INDEX IF NOT EXISTS `$1"
        $fileChanged = $true
        Write-Host "  - Corrigido unique indices em: $($file.Name)" -ForegroundColor Yellow
    }

    # 3. Corrigir CREATE TABLE sem IF NOT EXISTS
    if ($content -match "CREATE TABLE (?!IF NOT EXISTS)[^\s]+") {
        $content = $content -replace "CREATE TABLE ([^\s]+)", "CREATE TABLE IF NOT EXISTS `$1"
        $fileChanged = $true
        Write-Host "  - Corrigido tabelas em: $($file.Name)" -ForegroundColor Yellow
    }

    # 4. Corrigir CREATE OR REPLACE VIEW (já está OK, mas garantir)
    # Views já usam OR REPLACE, não precisa IF NOT EXISTS

    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFiles++
        $replacements = ($originalContent.Length - $content.Length) / -20 # Estimativa
        $totalReplacements += [Math]::Abs($replacements)
    }
}

Write-Host "`nResumo:" -ForegroundColor Green
Write-Host "  Arquivos corrigidos: $totalFiles" -ForegroundColor Cyan
Write-Host "  Total de correções: ~$totalReplacements" -ForegroundColor Cyan
Write-Host "`nMigrations prontas para deploy!" -ForegroundColor Green
