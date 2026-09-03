@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo    SENTINEL-X: Cloudflare Pages Auto-Deploy Utility
echo    Target: https://sentinel-tor.pages.dev
echo ======================================================================
echo.

cd /d "%~dp0frontend"

echo [1/2] Building Next.js production static export...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Next.js build failed! Aborting deployment.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Deploying static bundle to Cloudflare Pages (sentinel-tor)...
call npx -y wrangler pages deploy out --project-name=sentinel-tor --commit-dirty=true

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
