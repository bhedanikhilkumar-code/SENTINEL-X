@echo off
echo ======================================================================
echo    SENTINEL-X: Dark Web Threat Actor De-Anonymization Platform
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.

echo Starting FastAPI Backend on port 8000...
start "SENTINEL-X Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo Starting React + Vite Frontend on port 3000...
start "SENTINEL-X Frontend (Vite)" cmd /k "cd frontend && npm run dev -- --port 3000"

echo.
echo Both services are launching:
echo   - Backend API Docs:       http://localhost:8000/docs
echo   - Analyst Workbench UI:   http://localhost:3000
echo ======================================================================
