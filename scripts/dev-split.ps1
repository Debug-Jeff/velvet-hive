# Opens a Windows Terminal window split into two panes - one running the
# frontend (Vite) dev server, one running the backend (tsx watch) dev server.
# Falls back to a suggestion if Windows Terminal isn't installed.

$repoRoot = Split-Path -Parent $PSScriptRoot

$wt = Get-Command wt.exe -ErrorAction SilentlyContinue
if (-not $wt) {
    Write-Host "Windows Terminal (wt.exe) not found." -ForegroundColor Yellow
    Write-Host "Install it from the Microsoft Store, or just run: npm run dev:all"
    exit 1
}

wt.exe -w 0 new-tab --title "Velvet Hive" -d "$repoRoot" powershell -NoExit -Command "npm run dev" `; `
    split-pane -V -d "$repoRoot" powershell -NoExit -Command "npm run dev:server"
