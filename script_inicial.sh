#!/bin/bash

# Abrir uma aba no terminal
cd back-end/
node -v # deve retornar a versão 22
npm i -g pnpm
pnpm install
node teste-web.js

# Pegue o IP do back-end; isso será usado no app e no firmware/hardware

# Abrir outra aba no terminal
cd pcd-visual-app/
pnpm install
pnpm start
# Pressione 'w' se quiser abrir no navegador

# Abrir outra aba no terminal
# Rodar o firmware no Arduino
cd firmware/
cd esp32-pai-mestre/
# Editar no arquivo o SSID e senha com o SSID e senha do Wi-Fi
const char* defaultSsid = "FJ";
const char* defaultPassword = "#f39A@jl32*1";
# Para rede do evento
# Verificar o canal do Wi-Fi: 1, 6, 11 ou outro
# E colocar nos outros ESP-32
# Como módulo 1 e 3
# Trocar essa variável tanto no módulo 1 como no 3
int8_t channel = 4; // ← CANAL 4 DO SEU ROTEADOR "FJ"

# Aqui é preciso buildar corretamente; se não fizer isso certo, o resto do projeto não vai funcionar
# Muito importante isso

# Abrir outra aba no terminal
cd kaz-image-captioning/
# Leia o README para instalar as dependências
# É preciso pegar o IP da ESP-32 Cam
# Veja no Arduino Serial
# Para rodar apenas isso
python3 launcher.py --source esp32 --url http://172.25.26.13:81/stream --mode both --auto --interval 3 # Usar ESP-32 Cam
python3 launcher.py --source webcam --url http://172.25.26.13:81/stream --mode both --auto --interval 3 # Usar câmera do notebook
