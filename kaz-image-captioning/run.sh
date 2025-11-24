cd /home/fabiobrasileiro/estudos/consciencia-espacial-PCD-visual/kaz-image-captioning

# Exemplo básico (modo manual):
PYTHONPATH=/home/fabiobrasileiro/estudos/consciencia-espacial-PCD-visual/kaz-image-captioning \
/home/fabiobrasileiro/estudos/kaz-image-captioning/venv/bin/python src/esp32_to_server.py \
  --cam-url http://172.25.26.13:81/stream \
  --server-url http://localhost:3000

# Modo automático com captura a cada 3 segundos:
PYTHONPATH=/home/fabiobrasileiro/estudos/consciencia-espacial-PCD-visual/kaz-image-captioning \
/home/fabiobrasileiro/estudos/kaz-image-captioning/venv/bin/python src/esp32cam_to_server.py \
  --cam-url  http://172.25.26.13:81/stream  \
  --server-url http://localhost:3000 \
  --mode both \
  --auto \
  --interval 3