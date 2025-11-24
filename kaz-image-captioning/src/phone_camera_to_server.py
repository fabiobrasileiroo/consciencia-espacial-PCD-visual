"""
📱 Script de Integração CELULAR → Servidor Node.js
Captura frames da câmera do celular via IP, gera descrições traduzidas e envia via HTTP
Usa IP Webcam ou DroidCam para streaming da câmera do celular
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
            print(f"✅ Enviado via HTTP: {response.json().get('message', 'OK')}")
            return True
        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao enviar via HTTP: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='📱 Celular → Servidor Node.js')
    parser.add_argument('--phone-url', type=str, required=True,
                        help='URL da câmera do celular (ex: http://192.168.1.100:8080/video)')
    parser.add_argument('--server-url', type=str, default='http://localhost:3000',
                        help='URL do servidor Node.js')
    parser.add_argument('--interval', type=int, default=3,
                        help='Intervalo entre capturas em segundos')
    parser.add_argument('--rotate', type=int, default=0, choices=[0, 90, 180, 270],
                        help='Rotação da imagem')
    parser.add_argument('--auto', action='store_true',
                        help='Modo automático (captura contínua)')
    parser.add_argument('--headless', action='store_true',
                        help='Modo headless (sem interface gráfica)')
    
    args = parser.parse_args()
    
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║  📱 CELULAR → SERVIDOR NODE.JS                        ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    print(f"📹 Celular: {args.phone_url}")
    print(f"🖥️  Servidor: {args.server_url}")
    print(f"⏱️  Intervalo: {args.interval}s")
    print(f"🔄 Modo Auto: {'SIM' if args.auto else 'NÃO'}")
    print(f"👁️  Interface: {'NÃO' if args.headless else 'SIM'}\n")
    
    # Conectar à câmera
    print(f"📱 Conectando à câmera do celular...")
    cap = cv2.VideoCapture(args.phone_url)
    
    if not cap.isOpened():
        print("❌ Erro ao conectar à câmera do celular!")
        print("\n💡 Dicas:")
        print("   - Verifique se o app IP Webcam ou DroidCam está rodando")
        print("   - Verifique se a URL está correta")
        print("   - Para IP Webcam: http://IP:8080/video")
        print("   - Para DroidCam: http://IP:4747/video")
        return
    
    print("✅ Conectado à câmera do celular!\n")
    
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
            
            if not args.headless:
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
                
                cv2.imshow("Celular → Node.js", display_frame)
            
            # Captura automática
            current_time = time()
            should_capture = False
            
            if auto_mode and (current_time - last_capture_time >= args.interval):
                should_capture = True
                last_capture_time = current_time
            
            if not args.headless:
                key = cv2.waitKey(1) & 0xFF
                
                if key == 27 or key == ord('q'):
                    print("👋 Encerrando...")
                    break
                elif key == ord('a'):
                    auto_mode = not auto_mode
                    print(f"\n🔄 Modo {'AUTOMÁTICO' if auto_mode else 'MANUAL'} ativado\n")
                elif key == ord('c') or key == 32:
                    should_capture = True
            else:
                # Modo headless: só usa captura automática
                sleep(0.1)
            
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
                          if len(word) > 3 and word not in ['para', 'está', 'sobre', 'perto', 'sendo', 'como']]
                objects = objects[:5]  # Limitar a 5 objetos
                
                confidence = 0.85  # Confiança fictícia
                
                # Enviar ao servidor
                print("\n📤 Enviando ao servidor...")
                send_via_http(args.server_url, caption_pt, caption_kz, objects, confidence)
                
                print(f"{'='*60}\n")
                
    except KeyboardInterrupt:
        print("\n⚠️  Interrompido pelo usuário")
    
    finally:
        cap.release()
        if not args.headless:
            cv2.destroyAllWindows()
        print("\n✅ Programa finalizado.")

if __name__ == "__main__":
    main()
