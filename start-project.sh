#!/bin/bash

# Exit on error for initial setup
set -e

echo "========================================="
echo " Starting Master App Ecosystem"
echo "========================================="

# 1. Start Docker Containers (Postgres & Redis)
echo "[1/4] Starting Database and Redis (Docker Compose)..."
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker daemon is not running. Please start OrbStack or Docker Desktop."
  exit 1
fi
docker-compose up -d

# 2. Start AI Service (Python FastAPI)
echo "[2/4] Starting AI Service..."
cd apps/ai-service
if [ -d "venv" ]; then
  source venv/bin/activate
  # Assuming uvicorn is installed in the venv
  uvicorn main:app --reload --port 8000 &
  AI_PID=$!
else
  echo "WARNING: venv not found in apps/ai-service. Skipping AI service."
fi
cd ../..

# 3. Start Mobile App (Expo)
echo "[3/4] Starting Mobile App..."
cd apps/mobile
npm run start &
MOBILE_PID=$!
cd ../..

# 4. Start Web & Backend (Turborepo)
echo "[4/4] Starting Web (Next.js) & Backend (NestJS)..."
npm run dev &
TURBO_PID=$!

echo "========================================="
echo " All services are starting up!"
echo " - Backend & Web: Managed by Turbo (see output below)"
echo " - AI Service: Running on port 8000"
echo " - Mobile: Expo server running"
echo " - Database/Redis: Docker containers running"
echo "========================================="
echo " Press Ctrl+C to stop all services."
echo "========================================="

# Cleanup function to kill background processes on exit
cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $AI_PID $MOBILE_PID $TURBO_PID 2>/dev/null
  docker-compose down
  echo "All services stopped."
  exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for background processes to keep the script running
wait $TURBO_PID $MOBILE_PID $AI_PID
