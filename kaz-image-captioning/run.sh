bash -c "cd /home/fabiobrasileiro/estudos/consciencia-espacial-PCD-visual/kaz-image-captioning && source venv/bin/activate && python3 test_esp32cam.py --url http://192.168.100.57/stream"

# Atualizar lista de pacotes
sudo apt-get update


# Instalar as bibliotecas corretas para Ubuntu 24.04
sudo apt-get install -y libgl1-mesa-dev libglib2.0-0t64 libsm6 libxext6 libxrender-dev libgomp1 libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 libegl1-mesa-dev