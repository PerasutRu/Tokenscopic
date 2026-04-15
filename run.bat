@echo off
echo ===================================================
echo 🚀 Starting TokenizerLens...
echo ===================================================

python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)" >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3.12+ is required.
    python --version
    pause
    exit /b 1
)

echo.
echo 🐍 Starting Backend on http://localhost:8000...
cd backend
if not exist ".venv\Scripts\activate.bat" (
    echo 🛠 Creating backend virtual environment...
    python -m venv .venv
)
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
set "REQ_STAMP=.venv\.requirements_installed"
if not exist "%REQ_STAMP%" (
    echo 📦 Installing backend dependencies...
    pip install -r requirements.txt
    if %errorlevel% neq 0 exit /b %errorlevel%
    type nul > "%REQ_STAMP%"
) else (
    if requirements.txt newer "%REQ_STAMP%" (
        echo 📦 requirements.txt changed, reinstalling backend dependencies...
        pip install -r requirements.txt
        if %errorlevel% neq 0 exit /b %errorlevel%
        type nul > "%REQ_STAMP%"
    ) else (
        echo ✅ Backend dependencies already installed.
    )
)
start "TokenizerLens Backend" cmd /k "uvicorn main:app --reload --port 8000"
cd ..

echo.
echo 🌐 Starting Frontend on http://localhost:3000...
cd frontend
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)
start "TokenizerLens Frontend" cmd /k "npm start"
cd ..

echo.
echo ✅ Both servers have been started in separate terminal windows!
echo - Frontend is available at http://localhost:3000
echo - Backend is available at http://localhost:8000
echo.
echo To stop the servers, just close those new terminal windows.
echo ===================================================
pause
