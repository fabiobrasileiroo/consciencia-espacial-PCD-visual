# install.ps1 - PowerShell installer for Windows
# Usage: Open PowerShell as Administrator (if needed) and run:
#   ./install.ps1

param(
  [switch]$CPU,
  [switch]$GPU
)

$cwd = Split-Path -Parent $MyInvocation.MyCommand.Definition
$venv = Join-Path $cwd '.venv'

Function Ensure-Venv {
  if (-Not (Test-Path $venv)) {
    python -m venv $venv
    Write-Host "Created venv at $venv"
  } else {
    Write-Host "Venv already exists at $venv"
  }
}

Ensure-Venv

$activate = Join-Path $venv 'Scripts\Activate.ps1'
Write-Host "To activate the venv run: .\$activate"

# Try to run pip inside venv
$pip = Join-Path $venv 'Scripts\pip.exe'
& $pip install --upgrade pip setuptools wheel
& $pip install -r (Join-Path $cwd 'requirements.txt')
& $pip install googletrans==4.0.0rc1 websocket-client

if ($CPU) {
  Write-Host "Installing CPU-only PyTorch"
  & $pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
  & $pip install tensorflow
} elseif ($GPU) {
  Write-Host "GPU option selected. Please follow PyTorch/TensorFlow GPU installation docs:
https://pytorch.org/get-started/locally/ and https://www.tensorflow.org/install"
}

# Check model file
$modelPath = Join-Path $cwd 'checkpoints\kaz_model.pth'
if (Test-Path $modelPath) {
  Write-Host "Model found: $modelPath"
} else {
  Write-Host "⚠️ Model not found: $modelPath\nPlease download kaz_model.pth into the checkpoints folder (see README)"
}

Write-Host "\n✅ Installation finished! Activate the venv and run launcher.py"
Write-Host "PS> .\$activate"
Write-Host "PS> python launcher.py --source webcam --mode both --auto --interval 3"
