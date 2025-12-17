# Script to fix incomplete DROP POLICY statements
# Pattern: DROP POLICY IF EXISTS "name" ON public;
# Should be: DROP POLICY IF EXISTS "name" ON public.table_name;

Write-Host "Fixing incomplete DROP POLICY statements..." -ForegroundColor Green

$migrations = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql"

$totalFixed = 0

foreach ($file in $migrations) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $fileChanged = $false

    # Pattern: DROP POLICY IF EXISTS "policy_name" ON public;
    # Followed by: CREATE POLICY "policy_name" ON public.table_name
    $pattern = 'DROP POLICY IF EXISTS "([^"]+)" ON public;\s+(CREATE POLICY "[^"]+" ON (public\.\w+))'

    $matches = [regex]::Matches($content, $pattern)

    if ($matches.Count -gt 0) {
        # Process from back to front
        for ($i = $matches.Count - 1; $i -ge 0; $i--) {
            $match = $matches[$i]
            $policyName = $match.Groups[1].Value
            $tableName = $match.Groups[3].Value

            # Replace "ON public;" with "ON table_name;"
            $oldDrop = "DROP POLICY IF EXISTS `"$policyName`" ON public;"
            $newDrop = "DROP POLICY IF EXISTS `"$policyName`" ON $tableName;"

            $content = $content.Replace($oldDrop, $newDrop)
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $totalFixed++
            Write-Host "  - Fixed $($matches.Count) incomplete DROP statements in: $($file.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTotal files fixed: $totalFixed" -ForegroundColor Green
Write-Host "Migrations ready!" -ForegroundColor Green
