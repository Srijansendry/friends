#!/bin/bash
set -e

echo "Starting LNCT GenZ Connect..."

# Start API server in background
echo "→ Starting API server on port 8080..."
PORT=8080 pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Wait for API server to build and start (esbuild + node startup)
echo "→ Waiting for API server to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/api/healthz > /dev/null 2>&1; then
    echo "✓ API server is ready"
    break
  fi
  sleep 2
done

# Start frontend on port 5000 (Replit webview port)
echo "→ Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/genz-connect run dev

# If frontend exits, kill API server
kill $API_PID 2>/dev/null || true
