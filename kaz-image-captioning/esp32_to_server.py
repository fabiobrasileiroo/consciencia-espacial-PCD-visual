"""
Script headless para capturar do ESP32-CAM e enviar detecções para o servidor
Funciona sem interface gráfica - ideal para GitHub Codespaces
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
from datetime import datetime
import requests

# ===== CONFIGURAÇÕES DO MODELO =====
load_path = 'checkpoints/kaz_model.pth'
dict_path = 'vocabulary/vocab_kz.pickle'
img_size = 384

print("🔄 Carregando dicionário...")
with open(dict_path, 'rb') as f:
    coco_tokens = pickle.load(f)
print("✅ Dicionário carregado!")

# Verificar se o modelo existe
model_available = os.path.exists(load_path)

if model_available:
    try:
        print("🔄 Inicializando modelo...")
        drop_args = Namespace(enc=0.0, dec=0.0, enc_input=0.0, dec_input=0.0, other=0.0)
        model_args = Namespace(model_dim=512, N_enc=3, N_dec=3, dropout=0.0, drop_args=drop_args)

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

        checkpoint = torch.load(load_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()
        print("✅ Modelo carregado!")

        # Transformações de imagem
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
        
    except Exception as e:
        print(f"⚠️  Erro ao carregar modelo: {e}")
        print("📝 Continuando sem modelo")
        model_available = False
else:
    print("⚠️  Modelo não encontrado!")
    print("📝 Continuando sem modelo (apenas streaming)")
    model_available = False

# ===== FUNÇÕES =====
def cv2_to_pil(img):
    """Converte imagem OpenCV para PIL"""
    return PIL_Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

def translate_to_portuguese(text):
    """Traduz texto do cazaque para português"""
    try:
        translation = translator.translate(text, src='kk', dest='pt')
        return translation.text
    except Exception as e:
        print(f"⚠️  Erro na tradução: {e}")
        return text

def generate_caption(img):
    """Gera legenda para uma imagem"""
    if not model_available:
        return "Modelo não disponível", "Modelo não disponível", []
    
    print("🤖 Gerando legenda...")
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
    
    stop = time()
    print(f'📝 Descrição (Cazaque): {pred_kaz}')
    print(f'⏱️  Tempo: {stop-start:.2f}s')
    
    print("🌐 Traduzindo...")
    pred_pt = translate_to_portuguese(pred_kaz)
    print(f'📝 Descrição (Português): {pred_pt}')
    
    # Extrair objetos (simplificado)
    objects = [word for word in pred_pt.lower().split() if len(word) > 3][:3]
    
    return pred_kaz, pred_pt, objects

def send_to_server(server_url, description_kz, description_pt, objects, confidence):
    """Envia detecção para o servidor via HTTP POST"""
    payload = {
        "description_pt": description_pt,
        "description_kz": description_kz,
        "objects": objects,
        "confidence": confidence
    }
    
    try:
        response = requests.post(
            server_url,
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"📤 ✅ Enviado: {description_pt[:50]}...")
            return True
        else:
            print(f"❌ Erro {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro ao enviar: {e}")
        return False

def main_loop(esp32_url, server_url, interval, rotate):
    """Loop principal de captura e envio"""
    print(f"\n🎥 Conectando ao ESP32-CAM: {esp32_url}")
    
    cap = cv2.VideoCapture(esp32_url)
    
    if not cap.isOpened():
        print("❌ Erro ao conectar ao stream!")
        print("\n💡 DICAS:")
        print(f"  • Verifique se o ESP32-CAM está em: {esp32_url}")
        print("  • Teste no navegador primeiro")
        return
    
    print("✅ Conectado ao stream!")
    print(f"📡 Servidor: {server_url}")
    
    rotation_map = {0: None, 90: cv2.ROTATE_90_CLOCKWISE, 
                    180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}
    
    frame_count = 0
    detection_count = 0
    
    print(f"\n🚀 Iniciando captura (intervalo: {interval}s)")
    print("Pressione Ctrl+C para parar\n")
    
    last_capture = 0
    
    try:
        while True:
            ret, frame = cap.read()
            frame_count += 1
            
            if not ret:
                print("⚠️  Erro ao capturar frame, reconectando...")
                cap.release()
                sleep(1)
                cap = cv2.VideoCapture(esp32_url)
                if not cap.isOpened():
                    print("❌ Não foi possível reconectar")
                    break
                continue
            
            # Aplicar rotação
            if rotate != 0 and rotation_map[rotate] is not None:
                frame = cv2.rotate(frame, rotation_map[rotate])
            
            # Capturar a cada X segundos
            current_time = time()
            if current_time - last_capture >= interval:
                last_capture = current_time
                detection_count += 1
                
                print(f"\n📸 Captura #{detection_count} (frame {frame_count})")
                print(f"⏰ {datetime.now().strftime('%H:%M:%S')}")
                
                # Gerar legenda
                caption_kz, caption_pt, objects = generate_caption(frame)
                
                # Enviar para servidor
                send_to_server(
                    server_url,
                    caption_kz,
                    caption_pt,
                    objects,
                    confidence=0.75
                )
                
                print(f"✅ Detecção #{detection_count} processada")
            
            # Pequeno delay para não sobrecarregar
            sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n⚠️  Interrompido pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        cap.release()
        print("\n✅ Recursos liberados")

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='ESP32-CAM → Servidor (Headless)')
    parser.add_argument('--esp32-url', type=str, required=True,
                        help='URL do stream ESP32-CAM (ex: http://192.168.100.57:81/stream)')
    parser.add_argument('--server-url', type=str, required=True,
                        help='URL HTTP do servidor (ex: http://192.168.100.11:3000/api/esp32-cam/send-description)')
    parser.add_argument('--interval', type=int, default=5,
                        help='Intervalo entre capturas em segundos (default: 5)')
    parser.add_argument('--rotate', type=int, default=0, choices=[0, 90, 180, 270],
                        help='Rotação da imagem em graus')
    
    args = parser.parse_args()
    
    print("╔════════════════════════════════════════════════════════╗")
    print("║  📷 ESP32-CAM → SERVIDOR (HTTP POST)                  ║")
    print("╚════════════════════════════════════════════════════════╝")
    print(f"ESP32-CAM: {args.esp32_url}")
    print(f"Servidor: {args.server_url}")
    print(f"Intervalo: {args.interval}s")
    print(f"Modelo IA: {'✅ Ativo' if model_available else '❌ Inativo'}")
    print("════════════════════════════════════════════════════════\n")
    
    main_loop(
        args.esp32_url,
        args.server_url,
        args.interval,
        args.rotate
    )

if __name__ == "__main__":
    main()
