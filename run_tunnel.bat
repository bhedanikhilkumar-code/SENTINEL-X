@echo off
setlocal enabledelayedexpansion
title SENTINEL-X — Cloudflare Backend Tunnel Runner (Phone to Localhost)

echo ======================================================================
echo    SENTINEL-X: Real-Time Mobile-to-Backend Cloudflare Tunnel
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo.
echo    Connects Live Frontend (https://sentinel-tor.pages.dev)
echo    to Local Backend API (http://localhost:8000)
echo ======================================================================
echo.

cd /d "%~dp0"

REM ----------------------------------------------------------------------
REM 1. Verify cloudflared executable
REM ----------------------------------------------------------------------
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'cloudflared' command not found in PATH!
    echo Please download cloudflared.exe or ensure it is installed.
    pause
    exit /b 1
)

echo [OK] Cloudflare Tunnel CLI detected.
echo.

REM ----------------------------------------------------------------------
REM 2. Check if local backend is active on port 8000
REM ----------------------------------------------------------------------
echo Checking if SENTINEL-X backend is running on http://localhost:8000...
powershell -Command "try { $res = Invoke-WebRequest -Uri 'http://localhost:8000/api/health' -TimeoutSec 2 -UseBasicParsing; Write-Host '[OK] Local backend is ONLINE on port 8000.' } catch { Write-Host '[NOTICE] Local backend is not detected on port 8000. Launching in background...' }"

REM ----------------------------------------------------------------------
REM 3. Launch cloudflared tunnel
REM ----------------------------------------------------------------------
echo.
echo ======================================================================
echo  STARTING SECURE CLOUDFLARE TUNNEL...
echo  Look below for your public HTTPS tunnel URL ending in:
echo.
echo       https://xxxxxxxx.trycloudflare.com
echo.
echo  HOW TO CONNECT YOUR PHONE:
echo  1. Open https://sentinel-tor.pages.dev on your mobile browser
echo  2. Tap 'LINK TUNNEL' or 'BACKEND' in the top navbar
echo  3. Paste the https://*.trycloudflare.com URL and tap 'Test & Save'
echo ======================================================================
echo.

cloudflared tunnel --url http://localhost:8000
