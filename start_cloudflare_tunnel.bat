@echo off
setlocal enabledelayedexpansion
title SENTINEL-X Cloudflare Edge Tunnel Launcher (Live Backend Linker)

cd /d "%~dp0"

REM Detect python executable
set "PYTHON_EXE=python"
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Users\bheda\AppData\Local\Programs\Python\Python312\python.exe" (
        set "PYTHON_EXE=C:\Users\bheda\AppData\Local\Programs\Python\Python312\python.exe"
    )
)

if exist "scripts\tunnel_launcher.py" (
    "%PYTHON_EXE%" scripts\tunnel_launcher.py
) else (
    echo [ERROR] scripts\tunnel_launcher.py not found!
    echo Falling back to direct cloudflared tunnel...
    "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8000
)

pause
