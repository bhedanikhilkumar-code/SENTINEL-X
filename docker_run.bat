@echo off
echo ======================================================================
echo    SENTINEL-X: Docker Compose Multi-Container Launcher
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.

docker compose up --build -d

echo.
echo Containers launched successfully!
echo   - Analyst Workbench:      http://localhost:3000
echo   - Backend API Docs:       http://localhost:8000/docs
echo   - Backend Health:         http://localhost:8000/api/health
echo ======================================================================
pause
