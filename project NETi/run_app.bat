@echo off
echo Starting NETi (Unified Mode)...

set "FRONTEND_DIR=%~dp0frontend"
set "BACKEND_DIR=%~dp0backend"

:: Check if frontend dependencies exist
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd "%FRONTEND_DIR%"
    call npm install
    cd ..
)

:: Check if frontend build exists
if not exist "%FRONTEND_DIR%\out" (
    echo Frontend build not found. Building now... (this may take a minute)
    cd "%FRONTEND_DIR%"
    call npm run build
    cd ..
)

:: Start Backend (which now serves frontend too)
echo Starting Backend Server...
echo You can view the app at http://localhost:8000
echo.
cd "%BACKEND_DIR%"
call venv\Scripts\activate
python main.py
pause
