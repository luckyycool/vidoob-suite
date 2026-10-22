param(
    [string]$Target = "all" # "vidoob", "videosdrive", or "all"
)

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Compiling Vidoob Suite Production Bundles" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

node test.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed. Aborting deployment."
    exit 1
}

node build.js

if ($Target -eq "vidoob" -or $Target -eq "all") {
    Write-Host "`nDeploying vidoob.com to Cloudflare Pages..." -ForegroundColor Yellow
    npx wrangler pages deploy dist/vidoob --project-name=vidoob --commit-dirty=true
}

if ($Target -eq "videosdrive" -or $Target -eq "all") {
    Write-Host "`nDeploying videosdrive.com to Cloudflare Pages..." -ForegroundColor Yellow
    npx wrangler pages deploy dist/videosdrive --project-name=videosdrive --commit-dirty=true
}

Write-Host "`n✓ Deployment complete!" -ForegroundColor Green
