@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo    SENTINEL-X: Cloudflare Pages Auto-Deploy Utility
echo    Target: https://sentinel-tor.pages.dev
echo ======================================================================
echo.

cd /d "%~dp0frontend"

echo [1/2] Building frontend production static bundle...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Aborting deployment.
    pause
    exit /b %errorlevel%
)

if not exist "dist\_redirects" (
    echo /*    /index.html   200 > "dist\_redirects"
)

echo.
echo [2/2] Deploying static bundle to Cloudflare Pages (sentinel-tor)...
cd /d "%~dp0"
call npx -y wrangler pages deploy frontend/dist --project-name=sentinel-tor --branch=master --commit-dirty=true

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo    SUCCESS: Deployed live to https://sentinel-tor.pages.dev/
    echo ======================================================================
) else (
    echo.
    echo [NOTICE] Deployment encountered an error.
    echo If this is your first time deploying with wrangler, run:
    echo   npx wrangler login
    echo to authorize your Cloudflare account.
)

echo.
pause
