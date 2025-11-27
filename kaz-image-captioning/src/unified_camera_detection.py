"""
🎯 Sistema Unificado de Detecção + Descrição
Combina YOLO (detecção de objetos) + Modelo Kaz (descrição em linguagem natural)
Suporta ESP32-CAM, Webcam, Celular via IP
"""
import torch
import torchvision
import pickle
import cv2
from argparse import Namespace
from pathlib import Path
from PIL import Image as PIL_Image
from models.End_ExpansionNet_v2 import End_ExpansionNet_v2
from utils.language_utils import convert_vector_idx2word
from time import time, sleep
import os
import argparse
from deep_translator import GoogleTranslator
import json
import requests
import numpy as np
import tensorflow as tf

# ===== CONFIGURAÇÕES MODELO KAZ =====
BASE_DIR = Path(__file__).resolve().parent.parent
load_path = BASE_DIR / 'checkpoints' / 'kaz_model.pth'
dict_path = BASE_DIR / 'vocabulary' / 'vocab_kz.pickle'  # Vocabulário Kazakh (18365 palavras)
img_size = 384

print("🔄 Carregando dicionário...")
with open(dict_path, 'rb') as f:
    coco_tokens = pickle.load(f)
print("✅ Dicionário carregado!")

drop_args = Namespace(enc=0.0, dec=0.0, enc_input=0.0, dec_input=0.0, other=0.0)
model_args = Namespace(model_dim=512, N_enc=3, N_dec=3, dropout=0.0, drop_args=drop_args)

print("🔄 Inicializando modelo Kaz...")
kaz_model = End_ExpansionNet_v2(
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
print(f"🖥️  Dispositivo: {device}")
kaz_model.to(device)

if not os.path.exists(load_path):
    print(f"❌ ERRO: Checkpoint Kaz não encontrado em {load_path}")
    exit(1)

checkpoint = torch.load(load_path, map_location=device)
kaz_model.load_state_dict(checkpoint['model_state_dict'])
kaz_model.eval()
print("✅ Modelo Kaz carregado!")

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

translator = GoogleTranslator(source='auto', target='pt')

# ===== CONTROLE DE MODO =====
def check_operation_mode(server_url):
    """Verifica modo de operação via API"""
    try:
        url = f"{server_url}/api/operation-mode"
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            data = response.json()
            mode = data.get('state', {}).get('mode', 'manual')
            return mode
        else:
            print(f"⚠️  API retornou status {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Erro ao conectar com API: {e}")
        return None
    except Exception as e:
        print(f"⚠️  Erro inesperado na verificação de modo: {e}")
        return None

def check_manual_capture_request(server_url):
    """Verifica se há solicitação de captura manual pendente"""
    try:
        response = requests.get(f"{server_url}/api/esp32-cam/capture-status", timeout=2)
        if response.status_code == 200:
            data = response.json()
            return data.get('shouldCapture', False)
    except:
        pass
    return False

# ===== CONFIGURAÇÕES YOLO =====
TFLITE_MODEL = 'tflite_learn_810340_10.tflite'
yolo_available = os.path.exists(TFLITE_MODEL)

if yolo_available:
    print("🔄 Carregando modelo YOLO...")
    tflite_interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL)
    tflite_interpreter.allocate_tensors()
    t_in = tflite_interpreter.get_input_details()[0]
    t_out = tflite_interpreter.get_output_details()[0]
    IN_H, IN_W = t_in['shape'][1], t_in['shape'][2]
    in_scale, in_zero = t_in.get('quantization', (1.0, 0))
    out_scale, out_zero = t_out.get('quantization', (1.0, 0))
    print("✅ Modelo YOLO carregado!")
else:
    print("⚠️  Modelo YOLO não encontrado, continuando apenas com Kaz")

COCO_LABELS = [
    'person','bicycle','car','motorcycle','airplane','bus','train','truck','boat','traffic light',
    'fire hydrant','stop sign','parking meter','bench','bird','cat','dog','horse','sheep','cow',
    'elephant','bear','zebra','giraffe','backpack','umbrella','handbag','tie','suitcase','frisbee',
    'skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard',
    'tennis racket','bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple',
    'sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair','couch',
    'potted plant','bed','dining table','toilet','tv','laptop','mouse','remote','keyboard','cell phone',
    'microwave','oven','toaster','sink','refrigerator','book','clock','vase','scissors','teddy bear',
    'hair drier','toothbrush'
]

# Tradução dos labels COCO para Português (já traduzido, sem precisar de API)
COCO_LABELS_PT = [
    'pessoa','bicicleta','carro','moto','avião','ônibus','trem','caminhão','barco','semáforo',
    'hidrante','placa de pare','parquímetro','banco','pássaro','gato','cachorro','cavalo','ovelha','vaca',
    'elefante','urso','zebra','girafa','mochila','guarda-chuva','bolsa','gravata','mala','frisbee',
    'esquis','snowboard','bola esportiva','pipa','taco de beisebol','luva de beisebol','skate','prancha de surfe',
    'raquete de tênis','garrafa','taça de vinho','xícara','garfo','faca','colher','tigela','banana','maçã',
    'sanduíche','laranja','brócolis','cenoura','cachorro-quente','pizza','rosquinha','bolo','cadeira','sofá',
    'planta em vaso','cama','mesa de jantar','vaso sanitário','televisão','notebook','mouse','controle remoto','teclado','celular',
    'micro-ondas','forno','torradeira','pia','geladeira','livro','relógio','vaso','tesoura','ursinho de pelúcia',
    'secador de cabelo','escova de dentes'
]

def get_label_pt(cls_index):
    """Retorna o label em português para o índice da classe COCO"""
    if 0 <= cls_index < len(COCO_LABELS_PT):
        return COCO_LABELS_PT[cls_index]
    return f"objeto{cls_index}"

CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45

# ===== FUNÇÕES =====
def cv2_to_pil(img):
    """Converte imagem OpenCV para PIL"""
    return PIL_Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

def translate_to_portuguese(text):
    """Traduz texto gerado pelo modelo para português"""
    try:
        result = translator.translate(text)
        
        # Limpar duplicações e problemas comuns do Google Translate
        # Ex: "Homem usando fones Homem usando fones" -> "Homem usando fones"
        words = result.split()
        if len(words) > 3:
            # Verificar se há repetição de metade da frase
            half = len(words) // 2
            first_half = ' '.join(words[:half])
            second_half = ' '.join(words[half:2*half])
            
            if first_half == second_half:
                result = first_half
        
        return result
    except Exception as e:
        print(f"⚠️  Erro na tradução: {e}")
        return text

def generate_caption_kaz(img):
    """Gera legenda usando modelo Kaz"""
    start = time()
    
    pil_image = cv2_to_pil(img)
    
    if pil_image.mode != 'RGB':
        pil_image = PIL_Image.new("RGB", pil_image.size)
    
    preprocess_pil_image = transf_1(pil_image)
    tens_image_1 = torchvision.transforms.ToTensor()(preprocess_pil_image)
    tens_image_2 = transf_2(tens_image_1)
    
    image = tens_image_2.unsqueeze(0).to(device)
    
    with torch.no_grad():
        pred, _ = kaz_model(
            enc_x=image,
            enc_x_num_pads=[0],
            mode='beam_search',
            **beam_search_kwargs
        )
    
    pred = convert_vector_idx2word(pred[0][0], coco_tokens['idx2word_list'])[1:-1]
    pred[-1] = pred[-1] + '.'
    pred_kaz = ' '.join(pred).capitalize()
    
    gen_time = time() - start
    
    trans_start = time()
    pred_pt = translate_to_portuguese(pred_kaz)
    trans_time = time() - trans_start
    
    return pred_kaz, pred_pt, gen_time, trans_time

def xywh2xyxy(x):
    """Converte bbox de xywh para xyxy"""
    y = np.copy(x)
    y[..., 0] = x[..., 0] - x[..., 2] / 2.0
    y[..., 1] = x[..., 1] - x[..., 3] / 2.0
    y[..., 2] = x[..., 0] + x[..., 2] / 2.0
    y[..., 3] = x[..., 1] + x[..., 3] / 2.0
    return y

def do_nms(boxes, scores, iou_threshold=IOU_THRESHOLD, max_output=50):
    """Non-Maximum Suppression"""
    if len(boxes) == 0:
        return np.array([], dtype=np.int32)
    boxes_tf = tf.convert_to_tensor(boxes, dtype=tf.float32)
    scores_tf = tf.convert_to_tensor(scores, dtype=tf.float32)
    idx = tf.image.non_max_suppression(boxes_tf, scores_tf, max_output, iou_threshold=iou_threshold)
    return idx.numpy()

def detect_yolo(frame):
    """Detecta objetos usando YOLO"""
    if not yolo_available:
        return []
    
    h_orig, w_orig = frame.shape[:2]
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(frame_rgb, (IN_W, IN_H))
    input_data = np.expand_dims(resized, axis=0)
    
    if t_in['dtype'] == np.uint8:
        if in_scale != 0:
            input_data = (input_data / in_scale + in_zero).astype(np.uint8)
        else:
            input_data = input_data.astype(np.uint8)
    else:
        input_data = (np.float32(input_data) - 127.5) / 127.5
    
    try:
        tflite_interpreter.set_tensor(t_in['index'], input_data)
        tflite_interpreter.invoke()
        output = tflite_interpreter.get_tensor(t_out['index'])
    except Exception as e:
        print(f"⚠️  Erro YOLO: {e}")
        return []
    
    if t_out['dtype'] == np.uint8:
        if out_scale != 0:
            output = (output.astype(np.float32) - out_zero) * out_scale
        else:
            output = output.astype(np.float32)
    else:
        output = output.astype(np.float32)
    
    preds = output[0] if output.ndim == 3 else output
    
    if preds.ndim != 2 or preds.shape[1] < 6:
        return []
    
    obj_conf = preds[:, 4]
    mask_obj = obj_conf > CONF_THRESHOLD
    preds = preds[mask_obj]
    
    if preds.shape[0] == 0:
        return []
    
    class_probs = preds[:, 5:]
    class_ids = np.argmax(class_probs, axis=1)
    class_scores = np.max(class_probs, axis=1)
    scores = preds[:, 4] * class_scores
    
    keep = scores > CONF_THRESHOLD
    preds = preds[keep]
    scores = scores[keep]
    class_ids = class_ids[keep]
    
    if preds.shape[0] == 0:
        return []
    
    boxes_xywh = preds[:, :4]
    boxes_xyxy = xywh2xyxy(boxes_xywh)
    boxes_nms = np.stack([boxes_xyxy[:, 1], boxes_xyxy[:, 0], boxes_xyxy[:, 3], boxes_xyxy[:, 2]], axis=1)
    keep_idx = do_nms(boxes_nms, scores, IOU_THRESHOLD, max_output=50)
    
    detections = []
    for i in keep_idx:
        cls = int(class_ids[i])
        score = float(scores[i])
        x1n, y1n, x2n, y2n = boxes_xyxy[i]
        
        # Usar label em português diretamente
        label_name_en = COCO_LABELS[cls] if cls < len(COCO_LABELS) else f"cls{cls}"
        label_name_pt = get_label_pt(cls)
        
        detections.append({
            'class': label_name_pt,  # Já em português
            'class_en': label_name_en,  # Inglês para referência
            'confidence': score,
            'bbox': [float(x1n), float(y1n), float(x2n), float(y2n)]
        })
    
    return detections

def send_to_server(server_url, description_pt, description_kz, objects, confidence, source):
    """Envia detecção para o servidor"""
    try:
        url = f"{server_url}/api/esp32-cam/send-description"
        data = {
            "description_pt": description_pt,
            "description_kz": description_kz,
            "objects": objects,
            "confidence": confidence,
            "source": source  # "esp32-cam" ou "yolo+kaz" ou "webcam+kaz"
        }
        
        response = requests.post(url, json=data, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Enviado para servidor: {response.json().get('message', 'OK')}")
            return True
        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao enviar: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='🎯 Sistema Unificado de Detecção')
    parser.add_argument('--source', type=str, required=True,
                        choices=['esp32', 'webcam', 'phone'],
                        help='Fonte da câmera: esp32, webcam (notebook), phone (IP)')
    parser.add_argument('--url', type=str, 
                        help='URL da câmera (para esp32 ou phone)')
    parser.add_argument('--device', type=int, default=0,
                        help='ID do dispositivo webcam (padrão: 0)')
    parser.add_argument('--server-url', type=str, default='http://localhost:3000',
                        help='URL do servidor Node.js')
    parser.add_argument('--mode', type=str, choices=['kaz-only', 'yolo-only', 'both'], default='both',
                        help='Modo de detecção: kaz-only, yolo-only ou both')
    parser.add_argument('--interval', type=int, default=3,
                        help='Intervalo entre capturas em segundos')
    parser.add_argument('--auto', action='store_true',
                        help='Modo automático (captura contínua)')
    parser.add_argument('--headless', action='store_true',
                        help='Modo headless (sem interface gráfica)')
    
    args = parser.parse_args()
    
    # Validar configuração
    if args.source in ['esp32', 'phone'] and not args.url:
        print("❌ --url é obrigatório para esp32 ou phone")
        print("   Exemplo ESP32: --url http://172.25.26.13:81/stream")
        print("   Exemplo Phone: --url http://192.168.1.100:8080/video")
        return
    
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║  🎯 SISTEMA UNIFICADO DE DETECÇÃO                     ║")
    print("╚════════════════════════════════════════════════════════╝\n")
    print(f"📹 Fonte: {args.source.upper()}")
    if args.url:
        print(f"🔗 URL: {args.url}")
    else:
        print(f"📷 Dispositivo: {args.device}")
    print(f"🖥️  Servidor: {args.server_url}")
    print(f"🔧 Modo: {args.mode.upper()}")
    print(f"⏱️  Intervalo: {args.interval}s")
    print(f"🔄 Auto: {'SIM' if args.auto else 'NÃO'}")
    print(f"👁️  Interface: {'NÃO' if args.headless else 'SIM'}\n")
    
    # Conectar à câmera
    print(f"📹 Conectando à câmera...")
    if args.source == 'webcam':
        cap = cv2.VideoCapture(args.device)
        source_label = f"webcam-{args.device}"
    else:
        cap = cv2.VideoCapture(args.url)
        source_label = "esp32-cam" if args.source == 'esp32' else "phone-cam"
    
    if not cap.isOpened():
        print("❌ Erro ao conectar à câmera!")
        return
    
    print("✅ Câmera conectada!\n")
    
    if not args.auto and not args.headless:
        print("="*60)
        print("MODO MANUAL:")
        print("  👉 Pressione 'c' ou 'ESPAÇO' para capturar e processar")
        print("  👉 Pressione 'a' para alternar modo automático")
        print("  👉 Pressione 'ESC' ou 'q' para sair")
        print("="*60 + "\n")
    
    capture_count = 0
    last_capture_time = 0
    auto_mode = args.auto
    last_mode_check = 0
    current_mode = 'manual'
    
    # Verificar modo inicial
    print("🔍 Verificando modo inicial...")
    initial_mode = check_operation_mode(args.server_url)
    if initial_mode:
        current_mode = initial_mode
        auto_mode = (initial_mode == 'realtime')
        print(f"✅ Modo inicial: {initial_mode.upper()} (auto={auto_mode})\n")
    else:
        print("⚠️  Não foi possível verificar modo inicial, usando padrão: MANUAL\n")
    
    try:
        while True:
            # Verificar modo de operação a cada 2 segundos
            current_time_check = time()
            if current_time_check - last_mode_check > 2:
                api_mode = check_operation_mode(args.server_url)
                if api_mode and api_mode != current_mode:
                    current_mode = api_mode
                    auto_mode = (api_mode == 'realtime')
                    print(f"\n🔄 Modo alterado via API: {api_mode.upper()} (auto={auto_mode})\n")
                last_mode_check = current_time_check
            
            ret, frame = cap.read()
            
            if not ret:
                print("❌ Erro ao capturar frame")
                sleep(1)
                continue
            
            if not args.headless:
                display = frame.copy()
                
                status = f"Modo: {args.mode.upper()} | Capturas: {capture_count}"
                if auto_mode:
                    status = f"AUTO | {status}"
                
                cv2.putText(display, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.imshow("Sistema Unificado", display)
            
            # Controle de captura
            current_time = time()
            should_capture = False
            
            # Modo automático: captura por intervalo
            if auto_mode and (current_time - last_capture_time >= args.interval):
                should_capture = True
                last_capture_time = current_time
            
            # Modo manual: verifica se app solicitou captura
            if not auto_mode:
                if check_manual_capture_request(args.server_url):
                    should_capture = True
                    print("📱 Captura solicitada pelo app")
            
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
                # Em headless mode, aguardar menos em modo manual para resposta rápida
                sleep(0.05 if not auto_mode else 0.1)
            
            if should_capture:
                capture_count += 1
                print(f"\n{'='*60}")
                print(f"📸 Captura #{capture_count}")
                print(f"{'='*60}")
                
                yolo_objects = []
                yolo_confidence = 0.0
                description_pt = ""
                description_kz = ""
                
                # YOLO Detection
                if args.mode in ['yolo-only', 'both'] and yolo_available:
                    print("🎯 Executando detecção YOLO...")
                    yolo_start = time()
                    detections = detect_yolo(frame)
                    yolo_time = time() - yolo_start
                    
                    if detections:
                        yolo_objects = [d['class'] for d in detections]
                        yolo_confidence = sum(d['confidence'] for d in detections) / len(detections)
                        
                        print(f"🎯 YOLO detectou {len(detections)} objetos em {yolo_time:.2f}s:")
                        for det in detections:
                            print(f"   - {det['class']}: {det['confidence']:.2f}")
                
                # Descrição em linguagem natural (modelo gera em inglês)
                if args.mode in ['kaz-only', 'both']:
                    print("🤖 Gerando descrição...")
                    caption_en, caption_pt, gen_time, trans_time = generate_caption_kaz(frame)
                    
                    description_kz = caption_en  # Mantém compatibilidade com backend
                    description_pt = caption_pt
                    
                    print(f"📝 Inglês: {caption_en}")
                    print(f"📝 Português: {caption_pt}")
                    print(f"⏱️  Tempo: geração {gen_time:.2f}s | tradução {trans_time:.2f}s")
                
                # Combinar resultados
                if args.mode == 'yolo-only':
                    # Usar apenas YOLO
                    final_objects = yolo_objects
                    final_confidence = yolo_confidence
                    if yolo_objects:
                        description_pt = f"Detectado: {', '.join(yolo_objects)}"
                        description_kz = description_pt
                    else:
                        description_pt = "Nenhum objeto detectado"
                        description_kz = description_pt
                        
                elif args.mode == 'kaz-only':
                    # Usar apenas Kaz
                    final_objects = [word for word in description_pt.lower().split() 
                                    if len(word) > 3 and word not in ['para', 'está', 'sobre', 'perto', 'sendo']][:5]
                    final_confidence = 0.85
                    
                else:  # both
                    # Combinar YOLO + Kaz
                    final_objects = list(set(yolo_objects))  # Remover duplicatas do YOLO
                    final_confidence = yolo_confidence if yolo_objects else 0.85
                    
                    # Se Kaz detectou algo diferente, adicionar
                    kaz_words = [word for word in description_pt.lower().split() 
                                if len(word) > 3 and word not in ['para', 'está', 'sobre', 'perto', 'sendo']]
                    
                    for word in kaz_words[:3]:
                        if word not in [obj.lower() for obj in final_objects]:
                            final_objects.append(word)
                
                # Limitar objetos
                final_objects = final_objects[:10]
                
                print(f"\n📦 Objetos finais: {final_objects}")
                print(f"🎯 Confiança: {final_confidence:.2f}")
                
                # Enviar para servidor
                print("\n📤 Enviando para servidor...")
                send_to_server(
                    args.server_url,
                    description_pt,
                    description_kz,
                    final_objects,
                    final_confidence,
                    source_label
                )
                
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
