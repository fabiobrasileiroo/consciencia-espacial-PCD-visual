#!/bin/bash
# Script para executar o test_esp32cam.py com tradução

# Ativar ambiente virtual
source venv/bin/activate

# Executar o script
python3 test_esp32cam.py --url http://10.51.56.139:81/stream "$@"
