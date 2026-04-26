#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${1:-8082}"

if ! command -v npm &> /dev/null; then
    echo "Error: npm is required to run the Vite frontend"
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting Simple Frontend on port $PORT..."
echo "Open your browser: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop"
echo ""

exec npm run dev -- --host 0.0.0.0 --port "$PORT"
