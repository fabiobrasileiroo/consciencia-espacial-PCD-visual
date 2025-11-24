#!/usr/bin/env python3
"""
🚀 LAUNCHER - Sistema Unificado de Detecção
Execute diretamente sem depender do PATH do sistema
"""
import subprocess
import sys
import os
from pathlib import Path

# Detectar pasta atual automaticamente
SCRIPT_DIR = Path(__file__).parent.resolve()

# Tentar .venv primeiro (prioridade), depois venv
VENV_PYTHON = None
for venv_name in [".venv", "venv"]:
    candidate = SCRIPT_DIR / venv_name / "bin" / "python"
    if candidate.exists():
        VENV_PYTHON = candidate
        break

SCRIPT_PATH = SCRIPT_DIR / "src" / "unified_camera_detection.py"

def main():
    # Verificar se venv existe
    if VENV_PYTHON is None:
        print(f"❌ Erro: Python virtual environment não encontrado")
        print(f"   Procurado em: {SCRIPT_DIR}/venv ou {SCRIPT_DIR}/.venv")
        print("   Execute: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
        sys.exit(1)
    
    # Verificar se script existe
    if not SCRIPT_PATH.exists():
        print(f"❌ Erro: Script não encontrado em {SCRIPT_PATH}")
        sys.exit(1)
    
    # Configurar PYTHONPATH
    env = os.environ.copy()
    env['PYTHONPATH'] = str(SCRIPT_DIR)
    
    # Construir comando
    cmd = [str(VENV_PYTHON), str(SCRIPT_PATH)] + sys.argv[1:]
    
    print("╔════════════════════════════════════════════════════════╗")
    print("║  🚀 Iniciando Sistema Unificado                       ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    
    # Executar
    try:
        subprocess.run(cmd, env=env, check=True)
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Erro ao executar: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  Interrompido pelo usuário")
        sys.exit(0)

if __name__ == "__main__":
    main()
