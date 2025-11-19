"""
🔌 Script de Integração ESP32-CAM → Servidor Node.js
Captura frames do ESP32-CAM, gera descrições traduzidas e envia via WebSocket/HTTP
"""
import torch
import torchvision
import pickle
import cv2
from argparse import Namespace
from PIL import Image as PIL_Image
from models.End_ExpansionNet_v2 import End_ExpansionNet_v2
from utils.language_utils import convert_vector_idx2word
from time import time, sleep
import os
import argparse
from googletrans import Translator
import json
import requests
import websocket
import threading

# Configurações do modelo
load_path = 'checkpoints/kaz_model.pth'
dict_path = 'vocabulary/vocab_kz.pickle'
img_size = 384

print("🔄 Carregando dicionário...")
with open(dict_path, 'rb') as f:
    coco_tokens = pickle.load(f)
print("✅ Dicionário carregado!")

# Configurações do modelo
drop_args = Namespace(enc=0.0, dec=0.0, enc_input=0.0, dec_input=0.0, other=0.0)
model_args = Namespace(model_dim=512, N_enc=3, N_dec=3, dropout=0.0, drop_args=drop_args)

print("🔄 Inicializando modelo...")
model = End_ExpansionNet_v2(
    swin_img_size=img_size, swin_patch_size=4, swin_in_chans=3,
    swin_embed_dim=192, swin_depths=[2, 2, 18, 2], swin_num_heads=[6, 12, 24, 48],
    swin_window_size=12, swin_mlp_ratio=4., swin_qkv_bias=True, swin_qk_scale=None,
    swin_drop_rate=0.0, swin_attn_drop_rate=0.0, swin_drop_path_rate=0.0,
    swin_norm_layer=torch.nn.LayerNorm, swin_ape=False, swin_patch_norm=True,
    swin_use_checkpoint=False, final_swin_dim=1536,
    d_model=model_args.model_dim, N_enc=model_args.N_enc,
    N_dec=model_args.N_dec, num_heads=8, ff=2048,
    num_exp_enc_list=[32, 64, 128, 256, 512],
    num_exp_dec=16,
    output_word2idx=coco_tokens['word2idx_dict'],
    output_idx2word=coco_tokens['idx2word_list'],
    max_seq_len=63, drop_args=model_args.drop_args,
    rank=0
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🖥️  Usando dispositivo: {device}")
model.to(device)

if not os.path.exists(load_path):
    print(f"❌ ERRO: Checkpoint não encontrado em {load_path}")
    exit(1)

checkpoint = torch.load(load_path, map_location=device)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()
print("✅ Modelo carregado!")

# Transformações
transf_1 = torchvision.transforms.Compose([
    torchvision.transforms.Resize((img_size, img_size))
])
transf_2 = torchvision.transforms.Compose([
    torchvision.transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

beam_search_kwargs = {
    'beam_size': 5,
    'beam_max_seq_len': 63,
    'sample_or_max': 'max',
    'how_many_outputs': 1,
    'sos_idx': coco_tokens['word2idx_dict'][coco_tokens['sos_str']],
    'eos_idx': coco_tokens['word2idx_dict'][coco_tokens['eos_str']]
}

translator = Translator()

def translate_to_portuguese(text):
    """Traduz texto do cazaque para português"""
    try:
        translation = translator.translate(text, src='kk', dest='pt')
        return translation.text
    except Exception as e:
        print(f"⚠️  Erro na tradução: {e}")
        return text

def cv2_to_pil(img):
    """Converte imagem OpenCV para PIL"""
    return PIL_Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

def generate_caption(img, translate=True):
    """Gera legenda para uma imagem"""
    start = time()
    
    pil_image = cv2_to_pil(img)
    
    if pil_image.mode != 'RGB':
        pil_image = PIL_Image.new("RGB", pil_image.size)
    
    preprocess_pil_image = transf_1(pil_image)
    tens_image_1 = torchvision.transforms.ToTensor()(preprocess_pil_image)
    tens_image_2 = transf_2(tens_image_1)
    
    image = tens_image_2.unsqueeze(0).to(device)
    
    with torch.no_grad():
        pred, _ = model(
            enc_x=image,
            enc_x_num_pads=[0],
            mode='beam_search',
            **beam_search_kwargs
        )
    
    pred = convert_vector_idx2word(pred[0][0], coco_tokens['idx2word_list'])[1:-1]
    pred[-1] = pred[-1] + '.'
    pred_kaz = ' '.join(pred).capitalize()
    
    gen_time = time() - start
    
    if translate:
        trans_start = time()
        pred_pt = translate_to_portuguese(pred_kaz)
        trans_time = time() - trans_start
        
        return pred_kaz, pred_pt, gen_time, trans_time
    
    return pred_kaz, pred_kaz, gen_time, 0

def send_via_http(server_url, description_pt, description_kz, objects, confidence):
    """Envia descrição via HTTP POST"""
    try:
        url = f"{server_url}/api/esp32-cam/send-description"
        data = {
            "description_pt": description_pt,
            "description_kz": description_kz,
            "objects": objects,
            "confidence": confidence
        }
        
        response = requests.post(url, json=data, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Enviado via HTTP: {response.json()['message']}")
            return True
        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao enviar via HTTP: {e}")
        return False

class WebSocketClient:
    """Cliente WebSocket para enviar descrições"""
    
    def __init__(self, server_url):
        self.server_url = server_url.replace('http://', 'ws://').replace('https://', 'wss://')
        self.ws = None
        self.connected = False
        self.lock = threading.Lock()
        
    def connect(self):
        """Conecta ao servidor WebSocket"""
        try:
            ws_url = f"{self.server_url}/esp32-cam"
            print(f"🔌 Conectando ao WebSocket: {ws_url}")
            
            self.ws = websocket.WebSocketApp(
                ws_url,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close
            )
            
            # Rodar em thread separada
            wst = threading.Thread(target=self.ws.run_forever)
            wst.daemon = True
            wst.start()
            
            # Aguardar conexão
            for _ in range(10):
                if self.connected:
                    return True
                sleep(0.5)
            
            return False
            
        except Exception as e:
            print(f"❌ Erro ao conectar WebSocket: {e}")
            return False
    
    def on_open(self, ws):
        """Callback quando conecta"""
        print("✅ WebSocket conectado!")
        self.connected = True
        
        # Enviar identificação
        identify_msg = {
            "type": "identify",
            "deviceId": "ESP32-CAM-PYTHON",
            "timestamp": int(time() * 1000)
        }
        ws.send(json.dumps(identify_msg))
    
    def on_message(self, ws, message):
        """Callback quando recebe mensagem"""
        try:
            data = json.loads(message)
            print(f"📥 Servidor: {data.get('message', message)}")
        except:
            print(f"📥 Servidor: {message}")
    
    def on_error(self, ws, error):
        """Callback de erro"""
        print(f"❌ Erro WebSocket: {error}")
        self.connected = False
    
    def on_close(self, ws, close_status_code, close_msg):
        """Callback quando desconecta"""
        print(f"❌ WebSocket desconectado")
        self.connected = False
    
    def send_detection(self, description_pt, description_kz, objects, confidence):
        """Envia detecção via WebSocket"""
        if not self.connected or not self.ws:
            print("❌ WebSocket não conectado")
            return False
        
        try:
            with self.lock:
                message = {
                    "type": "detection",
                    "description_pt": description_pt,
                    "description_kz": description_kz,
                    "objects": objects,
                    "confidence": confidence,
                    "timestamp": int(time() * 1000)
                }
                
                self.ws.send(json.dumps(message))
                print(f"✅ Enviado via WebSocket")
                return True
                
        except Exception as e:
            print(f"❌ Erro ao enviar via WebSocket: {e}")
            return False

def main():
    parser = argparse.ArgumentParser(description='ESP32-CAM → Servidor Node.js')
    parser.add_argument('--cam-url', type=str, required=True,
                        help='URL do ESP32-CAM (ex: http://192.168.1.100:81/stream)')
    parser.add_argument('--server-url', type=str, default='http://localhost:3000',
                        help='URL do servidor Node.js')
    parser.add_argument('--mode', type=str, choices=['websocket', 'http', 'both'], default='both',
                        help='Modo de envio: websocket, http ou both')
    parser.add_argument('--interval', type=int, default=3,
                        help='Intervalo entre capturas em segundos')
    parser.add_argument('--rotate', type=int, default=0, choices=[0, 90, 180, 270],
                        help='Rotação da imagem')
    parser.add_argument('--auto', action='store_true',
                        help='Modo automático (captura contínua)')
    
    args = parser.parse_args()
    
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║  📷 ESP32-CAM → SERVIDOR NODE.JS                      ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    print(f"📹 Câmera: {args.cam_url}")
    print(f"🖥️  Servidor: {args.server_url}")
    print(f"📡 Modo: {args.mode.upper()}")
    print(f"⏱️  Intervalo: {args.interval}s")
    print(f"🔄 Modo Auto: {'SIM' if args.auto else 'NÃO'}\n")
    
    # Conectar WebSocket se necessário
    ws_client = None
    if args.mode in ['websocket', 'both']:
        ws_client = WebSocketClient(args.server_url)
        if not ws_client.connect():
            print("⚠️  Falha ao conectar WebSocket, usando apenas HTTP")
            args.mode = 'http'
        sleep(1)  # Aguardar identificação
    
    # Conectar à câmera
    print(f"🎥 Conectando ao ESP32-CAM...")
    cap = cv2.VideoCapture(args.cam_url)
    
    if not cap.isOpened():
        print("❌ Erro ao conectar ao ESP32-CAM!")
        return
    
    print("✅ Conectado ao ESP32-CAM!\n")
    
    rotation_map = {0: None, 90: cv2.ROTATE_90_CLOCKWISE, 
                    180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}
    
    capture_count = 0
    last_capture_time = 0
    
    if not args.auto:
        print("="*60)
        print("MODO MANUAL:")
        print("  👉 Pressione 'c' ou 'ESPAÇO' para capturar e enviar")
        print("  👉 Pressione 'a' para alternar modo automático")
        print("  👉 Pressione 'ESC' ou 'q' para sair")
        print("="*60 + "\n")
    else:
        print("="*60)
        print("MODO AUTOMÁTICO ATIVO")
        print(f"  Capturando a cada {args.interval} segundos")
        print("  Pressione 'a' para alternar para manual")
        print("  Pressione 'ESC' ou 'q' para sair")
        print("="*60 + "\n")
    
    auto_mode = args.auto
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("❌ Erro ao capturar frame")
                sleep(1)
                continue
            
            if args.rotate != 0 and rotation_map[args.rotate] is not None:
                frame = cv2.rotate(frame, rotation_map[args.rotate])
            
            display_frame = frame.copy()
            
            # Instruções na tela
            if auto_mode:
                cv2.putText(display_frame, "MODO AUTO - Capturando automaticamente", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            else:
                cv2.putText(display_frame, "Pressione 'c' ou ESPACO para capturar", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            cv2.putText(display_frame, f"Capturas: {capture_count}", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            cv2.imshow("ESP32-CAM → Node.js", display_frame)
            
            # Captura automática
            current_time = time()
            should_capture = False
            
            if auto_mode and (current_time - last_capture_time >= args.interval):
                should_capture = True
                last_capture_time = current_time
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == 27 or key == ord('q'):
                print("👋 Encerrando...")
                break
            elif key == ord('a'):
                auto_mode = not auto_mode
                print(f"\n🔄 Modo {'AUTOMÁTICO' if auto_mode else 'MANUAL'} ativado\n")
            elif key == ord('c') or key == 32:
                should_capture = True
            
            if should_capture:
                capture_count += 1
                print(f"\n{'='*60}")
                print(f"📸 Captura #{capture_count}")
                print(f"{'='*60}")
                
                # Gerar legenda
                print("🤖 Gerando legenda...")
                caption_kz, caption_pt, gen_time, trans_time = generate_caption(frame)
                
                print(f"📝 Cazaque: {caption_kz}")
                print(f"📝 Português: {caption_pt}")
                print(f"⏱️  Tempo geração: {gen_time:.2f}s | Tradução: {trans_time:.2f}s")
                
                # Extrair objetos da descrição
                objects = [word for word in caption_pt.lower().split() 
                          if len(word) > 3 and word not in ['para', 'está', 'sobre', 'perto']]
                objects = objects[:5]  # Limitar a 5 objetos
                
                confidence = 0.85  # Confiança fictícia
                
                # Enviar ao servidor
                print("\n📤 Enviando ao servidor...")
                
                if args.mode in ['http', 'both']:
                    send_via_http(args.server_url, caption_pt, caption_kz, objects, confidence)
                
                if args.mode in ['websocket', 'both'] and ws_client:
                    ws_client.send_detection(caption_pt, caption_kz, objects, confidence)
                
                print(f"{'='*60}\n")
                
    except KeyboardInterrupt:
        print("\n⚠️  Interrompido pelo usuário")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\n✅ Programa finalizado.")

if __name__ == "__main__":
    main()
