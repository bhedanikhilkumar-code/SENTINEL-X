@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo    SENTINEL-X: Git Push + Cloudflare Pages Auto-Deploy
echo    Target GitHub: https://github.com/bhedanikhilkumar-code/SENTINEL-X
echo    Target Live:   https://sentinel-tor.pages.dev
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Staging all changed files...
git add -A

set /p MSG="Enter commit message (Press ENTER for default 'feat: update sentinel-x platform'): "
if "!MSG!"=="" (
    set MSG=feat: update sentinel-x platform
)

echo [2/3] Committing changes...
git commit -m "!MSG!"
if %errorlevel% neq 0 (
    echo [INFO] No new changes to commit or commit succeeded.
)

echo.
echo Pushing to GitHub (origin/master)...
git push origin master
if %errorlevel% neq 0 (
    echo [WARNING] Git push failed. Proceeding to Cloudflare deploy...
) else (
    echo [OK] Git push successful!
)

echo.
echo [3/3] Deploying directly to Cloudflare Pages (sentinel-tor)...
call deploy_cloudflare.bat

