#!/bin/bash

echo "🚀 Starting TokenizerLens..."

if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ Python 3.12+ is required, but python3 was not found."
    exit 1
fi

python3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)"
if [ $? -ne 0 ]; then
    echo "❌ Python 3.12+ is required."
    echo "Detected: $(python3 --version 2>&1)"
    exit 1
fi

# Start Backend
echo "🐍 Starting Backend on http://localhost:8000 ..."
cd backend
if [ ! -d ".venv" ]; then
    echo "🛠 Creating backend virtual environment..."
    python3 -m venv .venv
fi
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
REQ_STAMP=".venv/.requirements_installed"
if [ ! -f "$REQ_STAMP" ] || [ requirements.txt -nt "$REQ_STAMP" ]; then
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt && touch "$REQ_STAMP"
else
    echo "✅ Backend dependencies already installed."
fi
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "🌐 Starting Frontend on http://localhost:3000 ..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are running!"
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to cleanly kill the background processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID" INT

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
