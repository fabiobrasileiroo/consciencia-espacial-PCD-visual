#!/usr/bin/env bash
# install.sh
# Simple installer for kaz-image-captioning (Linux / macOS)
# - creates .venv if missing
# - upgrades pip and installs requirements
# - installs optional heavy deps (PyTorch/TensorFlow) when requested
# Usage:
#   bash install.sh           # installs default requirements
#   bash install.sh --cpu     # explicitly install CPU builds of torch/tensorflow
#   bash install.sh --gpu     # user must install GPU builds separately (script will show instructions)

set -e
CWD=$(cd "$(dirname "$0")" && pwd)
VENV_DIR="$CWD/.venv"
PYTHON_BIN="python3"
PIP_BIN=""
FORCE_CPU=0
FORCE_GPU=0

for arg in "$@"; do
  case "$arg" in
    --cpu) FORCE_CPU=1; shift ;;
    --gpu) FORCE_GPU=1; shift ;;
  esac
done

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "python3 not found. Please install Python 3.8+ and try again." >&2
  exit 1
fi

# Create venv if missing
if [ ! -d "$VENV_Dpython3 launcher.py --source esp32 --url http://172.25.26.13:81/stream --mode both --auto --interval 3IR" ]; then
  echo "Creating virtualenv at $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

PIP_BIN="$VENV_DIR/bin/pip"
PY_BIN="$VENV_DIR/bin/python"

# Upgrade pip + install base requirements
echo "Upgrading pip and installing base requirements..."
"$PIP_BIN" install --upgrade pip setuptools wheel
"$PIP_BIN" install -r "$CWD/requirements.txt"

# Install googletrans and websocket-client if not present
"$PIP_BIN" install --upgrade googletrans==4.0.0rc1 websocket-client

# Optional heavy deps
if [ "$FORCE_CPU" -eq 1 ]; then
  echo "Installing CPU-only PyTorch + TensorFlow"
  "$PIP_BIN" install --upgrade torch torchvision --index-url https://download.pytorch.org/whl/cpu
  "$PIP_BIN" install --upgrade tensorflow
elif [ "$FORCE_GPU" -eq 1 ]; then
  echo "GPU mode selected: please follow PyTorch/TensorFlow official guides for GPU install, or run with --cpu to install CPU-only." 
  echo "PyTorch (GPU) example: https://pytorch.org/get-started/locally/" 
fi

# Check for model file (just a friendly check, don't fail)
if [ -f "$CWD/checkpoints/kaz_model.pth" ]; then
  echo "Model found: $CWD/checkpoints/kaz_model.pth"
else
  echo "⚠️  Modelo não encontrado em checkpoints/kaz_model.pth" 
  echo "   Baixe o modelo (kaz_model.pth) do Google Drive e coloque em checkpoints/"
fi

# Success message
echo "\n✅ Instalacao completada!\n"
cat <<EOF
Agora ative o ambiente e execute:

  source .venv/bin/activate
  python3 launcher.py --source webcam --mode both --auto --interval 3

Windows: use install.ps1 (PowerShell) ou ative .venv\\Scripts\\Activate.ps1
EOF

exit 0
