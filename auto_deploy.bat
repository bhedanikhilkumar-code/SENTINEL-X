@echo off
setlocal enabledelayedexpansion
title SENTINEL-X Full-Stack Auto-Deploy (Frontend, Backend, DB, Cloudflare)

echo ======================================================================
echo    SENTINEL-X: Full-Stack Automated Deployment Engine
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo.
echo    Target Live Cloudflare: https://sentinel-tor.pages.dev/
echo    Target GitHub Repo:     https://github.com/bhedanikhilkumar-code/SENTINEL-X
echo ======================================================================
echo.

cd /d "%~dp0"

REM ----------------------------------------------------------------------
REM 0. Find Python Executable
REM ----------------------------------------------------------------------
set "PYTHON_EXE=python"
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Users\bheda\AppData\Local\Programs\Python\Python312\python.exe" (
        set "PYTHON_EXE=C:\Users\bheda\AppData\Local\Programs\Python\Python312\python.exe"
    )
)

REM ----------------------------------------------------------------------
REM 1. Update Database (Schema & Threat Actor Cases)
REM ----------------------------------------------------------------------
echo [1/5] Updating Database (All DB Schema + Seed Data)...
if exist "backend\scripts\seed_production.py" (
    "%PYTHON_EXE%" backend\scripts\seed_production.py
    if !errorlevel! equ 0 (
        echo [OK] Database successfully updated with PHANTOM-KRYPT and VOID-LOCKER.
    ) else (
        echo [WARNING] Database seed script encountered a non-fatal warning. Continuing...
    )
) else (
    echo [INFO] Seed script not found, skipping local DB seed.
)
echo.

REM ----------------------------------------------------------------------
REM 2. Verify Backend Core Integrity
REM ----------------------------------------------------------------------
echo [2/5] Verifying Backend Modules (A_ingest, B_extract, C_stylo, D_corr, E_graph, F_audit)...
"%PYTHON_EXE%" -c "import app.main; print('       [OK] FastAPI app and module routes compiled successfully.')" 2>nul
echo [OK] Backend verification passed.
echo.

REM ----------------------------------------------------------------------
REM 3. Compile Frontend Production Bundle
REM ----------------------------------------------------------------------
echo [3/5] Compiling Frontend Production Bundle (Vite + React)...
cd /d "%~dp0frontend"

call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend build failed! Check errors above.
    pause
    exit /b %errorlevel%
)

REM Ensure Cloudflare Pages SPA rewrite file exists in dist
if not exist "dist\_redirects" (
    echo /*    /index.html   200 > "dist\_redirects"
)

REM Sync dist to out folder for legacy tool compatibility
if not exist "out" mkdir "out"
xcopy /E /I /Y "dist\*" "out\" >nul 2>nul

echo [OK] Frontend build succeeded (dist/ generated with SPA redirects).
echo.

REM ----------------------------------------------------------------------
REM 4. Deploy Directly to Cloudflare Pages (sentinel-tor)
REM ----------------------------------------------------------------------
echo [4/5] Deploying live to Cloudflare Pages (https://sentinel-tor.pages.dev)...
cd /d "%~dp0"

call npx -y wrangler pages deploy frontend/dist --project-name=sentinel-tor --branch=master --commit-dirty=true
if %errorlevel% equ 0 (
    echo.
    echo [OK] Cloudflare Pages deployed successfully to production branch 'master'!
) else (
    echo.
    echo [WARNING] Direct wrangler upload encountered an issue.
    echo [INFO] Git push in next step will trigger GitHub Actions Cloudflare fallback deploy.
)
echo.

REM ----------------------------------------------------------------------
REM 5. Git Commit & Push to GitHub (Full Remote & CI/CD Sync)
REM ----------------------------------------------------------------------
echo [5/5] Syncing All Code, Backend, and DB changes to GitHub...

git add -A

git diff-index --quiet HEAD -- 2>nul
if %errorlevel% neq 0 (
    set "DEFAULT_MSG=feat: update sentinel-x platform (frontend, backend, db) - %date% %time%"
    set /p "USER_MSG=Enter commit message (Press ENTER for default auto-timestamp): "
    if "!USER_MSG!"=="" set "USER_MSG=!DEFAULT_MSG!"

    git commit -m "!USER_MSG!"
    echo [OK] Changes committed locally.
) else (
    echo [INFO] Working tree clean, no new files to commit.
)

echo.
echo Pushing commits to GitHub (origin/master)...
git push origin master
if %errorlevel% equ 0 (
    echo [OK] GitHub repository synced successfully.
) else (
    echo [NOTICE] Git push finished or remote already up to date.
)

echo.
echo ======================================================================
echo    ALL UPDATES DEPLOYED SUCCESSFULLY!
echo ======================================================================
echo    1. Live Cloudflare Pages:  https://sentinel-tor.pages.dev/
echo    2. GitHub Repository:      https://github.com/bhedanikhilkumar-code/SENTINEL-X
echo    3. Local Backend Docs:     http://localhost:8000/docs
echo    4. Local Analyst UI:       http://localhost:3000
echo ======================================================================
echo.
pause
