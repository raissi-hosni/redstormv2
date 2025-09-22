#!/usr/bin/env bash
# run.sh  –  starts RedStorm front + back in development mode
set -euo pipefail
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

log ()  { echo -e "${BLUE}[run.sh]${NC} $1"; }
ok  ()  { echo -e "${GREEN}✔${NC} $1"; }

log "Installing Node dependencies (first run only)…"
[ -d node_modules ] || npm install
ok "Node modules ready"

log "Installing Python dependencies (first run only)…"
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
ok "Python venv ready"
cd ..
log "Starting front-end + back-end (concurrently)…"
trap 'kill %1 %2 2>/dev/null' EXIT
npm run dev:full