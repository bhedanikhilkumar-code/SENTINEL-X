@echo off
echo ======================================================================
echo    SENTINEL-X: Dark Web Threat Actor De-Anonymization Platform
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.

echo Starting FastAPI Backend on port 8000...
start "SENTINEL-X Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --port 8000"

timeout /t 2 >nul

echo Starting Next.js Frontend on port 3000...
start "SENTINEL-X Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are launching:
echo   - Backend API Docs:       http://localhost:8000/docs
echo   - Analyst Workbench UI:   http://localhost:3000
echo ======================================================================
