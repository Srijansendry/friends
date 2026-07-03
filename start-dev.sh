#!/bin/bash
set -e

echo "Starting LNCT GenZ Connect..."

# Start API server in background
echo "→ Starting API server on port 8080..."
PORT=8080 pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Always clean up the API server process on exit
trap 'kill $API_PID 2>/dev/null || true' EXIT INT TERM ERR

# Wait for API server to build and start (esbuild + node startup)
echo "→ Waiting for API server to be ready..."
READY=false
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/api/healthz > /dev/null 2>&1; then
    READY=true
    echo "✓ API server is ready"
    break
  fi
  sleep 2
done

if [ "$READY" != "true" ]; then
  echo "✗ API server failed to start within 60 seconds. Check the logs above."
  exit 1
fi

# Start frontend on port 5000 (Replit webview port)
echo "→ Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/genz-connect run dev
