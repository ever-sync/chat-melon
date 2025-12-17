# Script to add DROP TRIGGER IF EXISTS before CREATE TRIGGER

Write-Host "Adding DROP TRIGGER IF EXISTS..." -ForegroundColor Green

$migrations = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql"

$totalFixed = 0

foreach ($file in $migrations) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content

    # Regex to find CREATE TRIGGER without DROP before
    # Pattern: CREATE TRIGGER trigger_name BEFORE/AFTER ... ON table_name
    $pattern = 'CREATE TRIGGER\s+(\w+)\s+(BEFORE|AFTER)\s+[^\n]+\s+ON\s+([\w\.]+)'

    $matches = [regex]::Matches($content, $pattern)

    if ($matches.Count -gt 0) {
        # Process from back to front to not affect indices
        for ($i = $matches.Count - 1; $i -ge 0; $i--) {
            $match = $matches[$i]
            $triggerName = $match.Groups[1].Value
            $tableName = $match.Groups[3].Value

            # Check if DROP already exists before this CREATE
            $beforeText = $content.Substring(0, $match.Index)
            if (-not ($beforeText -match "DROP TRIGGER IF EXISTS $triggerName ON $tableName")) {
                # Insert DROP before the CREATE
                $dropStatement = "DROP TRIGGER IF EXISTS $triggerName ON $tableName;`n"
                $content = $content.Insert($match.Index, $dropStatement)
            }
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $totalFixed++
            Write-Host "  - Fixed $($matches.Count) triggers in: $($file.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTotal files fixed: $totalFixed" -ForegroundColor Green
Write-Host "Migrations ready!" -ForegroundColor Green
