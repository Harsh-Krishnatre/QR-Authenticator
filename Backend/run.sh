#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

USE_NGROK=false
PORT=""

usage() {
  cat <<'EOF'
Usage:
  ./run.sh                 Run backend only (npm run dev)
  ./run.sh --ngrok         Run backend and expose it with ngrok
  ./run.sh --port <port>   Override backend port (default: from .env or 8000)
  ./run.sh --help          Show this help

Examples:
  ./run.sh
  ./run.sh --ngrok
  ./run.sh --ngrok --port 8000
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ngrok)
      USE_NGROK=true
      shift
      ;;
    --port)
      if [[ $# -lt 2 ]]; then
        echo "Error: --port requires a value" >&2
        exit 1
      fi
      PORT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PORT" ]]; then
  if [[ -f .env ]]; then
    PORT="$(grep -E '^PORT=' .env | tail -n 1 | cut -d '=' -f2 | tr -d '[:space:]' || true)"
  fi
  PORT="${PORT:-8000}"
fi

if [[ "$USE_NGROK" == false ]]; then
  echo "Starting backend on port $PORT with nodemon..."
  exec npx nodemon --watch src --watch server.js --ext js,json --signal SIGTERM server.js
fi

BACKEND_PID=""
NGROK_PID=""
TAIL_PID=""

mkdir -p .logs

echo "Starting backend (nodemon)..."
npx nodemon --watch src --watch server.js --ext js,json --signal SIGTERM server.js > .logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait until backend is reachable locally
for _ in $(seq 1 40); do
  if curl -fsS "http://localhost:${PORT}/api/v1/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://localhost:${PORT}/api/v1/health" >/dev/null 2>&1; then
  echo "Backend did not become healthy on port ${PORT}. Check .logs/backend.log" >&2
  exit 1
fi

echo "Backend is running on http://localhost:${PORT}"

# Avoid ERR_NGROK_334 by stopping existing local ngrok http <port> processes.
EXISTING_NGROK_PIDS="$(pgrep -f "ngrok http ${PORT}" || true)"
if [[ -n "$EXISTING_NGROK_PIDS" ]]; then
  echo "Stopping existing ngrok tunnel(s) on port ${PORT}: ${EXISTING_NGROK_PIDS}"
  kill $EXISTING_NGROK_PIDS 2>/dev/null || true
fi

if command -v ngrok >/dev/null 2>&1; then
  NGROK_CMD=(ngrok)
else
  NGROK_CMD=(npx ngrok)
fi

echo "Starting ngrok tunnel..."
if [[ "${NGROK_CMD[0]}" == "ngrok" ]]; then
  ngrok http "$PORT" --log=stdout > .logs/ngrok.log 2>&1 &
else
  npx ngrok http "$PORT" --log=stdout > .logs/ngrok.log 2>&1 &
fi
NGROK_PID=$!

# Discover ngrok API port (4040 default, 4041 fallback)
NGROK_API_PORT=""
for candidate in 4040 4041; do
  if curl -fsS "http://127.0.0.1:${candidate}/api/tunnels" >/dev/null 2>&1; then
    NGROK_API_PORT="$candidate"
    break
  fi
done

# Wait for public_url to appear
PUBLIC_URL=""
for _ in $(seq 1 30); do
  if [[ -z "$NGROK_API_PORT" ]]; then
    for candidate in 4040 4041; do
      if curl -fsS "http://127.0.0.1:${candidate}/api/tunnels" >/dev/null 2>&1; then
        NGROK_API_PORT="$candidate"
        break
      fi
    done
  fi

  if [[ -n "$NGROK_API_PORT" ]]; then
    PUBLIC_URL="$(curl -fsS "http://127.0.0.1:${NGROK_API_PORT}/api/tunnels" | grep -o 'https://[^\"]*' | head -n 1 || true)"
    if [[ -n "$PUBLIC_URL" ]]; then
      break
    fi
  fi
  sleep 1
done

echo
if [[ -n "$PUBLIC_URL" ]]; then
  echo "Public URL: ${PUBLIC_URL}"
  echo "Health URL: ${PUBLIC_URL}/api/v1/health"
else
  echo "ngrok started, but public URL was not detected automatically."
  echo "Check .logs/ngrok.log"
fi

echo
echo "Logs:"
echo "  Backend: .logs/backend.log"
echo "  Ngrok:   .logs/ngrok.log"
echo
echo "Press Ctrl+C to stop backend and ngrok."
echo "--- Backend logs (live) ---"
tail -f .logs/backend.log &
TAIL_PID=$!

cleanup() {
  echo
  echo "Stopping processes..."
  kill "$TAIL_PID" 2>/dev/null || true
  if [[ -n "$NGROK_PID" ]] && kill -0 "$NGROK_PID" 2>/dev/null; then
    kill "$NGROK_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Keep script alive while both background services run.
wait "$NGROK_PID"
