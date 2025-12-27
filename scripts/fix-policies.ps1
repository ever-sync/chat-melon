# Script para adicionar DROP POLICY IF EXISTS antes de CREATE POLICY

Write-Host "Adicionando DROP POLICY IF EXISTS..." -ForegroundColor Green

$migrations = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql"

$totalFixed = 0

foreach ($file in $migrations) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content

    # Regex para encontrar CREATE POLICY sem DROP antes
    $pattern = '(?<!DROP POLICY IF EXISTS[^\n]*\n)CREATE POLICY "([^"]+)"\s+ON\s+(\w+)'

    $matches = [regex]::Matches($content, $pattern)

    if ($matches.Count -gt 0) {
        # Processar de trás para frente para não afetar os índices
        for ($i = $matches.Count - 1; $i -ge 0; $i--) {
            $match = $matches[$i]
            $policyName = $match.Groups[1].Value
            $tableName = $match.Groups[2].Value

            # Inserir DROP antes do CREATE
            $dropStatement = "DROP POLICY IF EXISTS `"$policyName`" ON $tableName;`n"
            $content = $content.Insert($match.Index, $dropStatement)
        }

        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalFixed++
        Write-Host "  - Corrigido $($matches.Count) policies em: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`nTotal de arquivos corrigidos: $totalFixed" -ForegroundColor Green
Write-Host "Migrations prontas!" -ForegroundColor Green
