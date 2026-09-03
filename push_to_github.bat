@echo off
echo ======================================================================
echo    SENTINEL-X: One-Click GitHub Remote Sync Utility
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH!
    pause
    exit /b 1
)

REM Check existing remote origin
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo No remote origin repository configured yet.
    echo Please create a repository on GitHub (e.g., https://github.com/your-username/SENTINEL-X.git)
    echo.
    set /p REPO_URL="Enter your GitHub Repository URL: "
    if "%REPO_URL%"=="" (
        echo [ERROR] No URL provided. Aborting.
        pause
        exit /b 1
    )
    git remote add origin %REPO_URL%
    echo Remote origin added: %REPO_URL%
)

echo.
echo Syncing master branch to GitHub...
git branch -M master
git push -u origin master

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo    SUCCESS: Codebase successfully pushed to GitHub!
    echo ======================================================================
) else (
    echo.
    echo [NOTICE] Push encountered an authentication or remote rejection.
    echo If this is your first push to a private repo, please authenticate with GitHub.
)

pause
