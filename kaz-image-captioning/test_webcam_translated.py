"""
Script para testar o modelo de Image Captioning com a webcam do notebook
COM TRADUÇÃO AUTOMÁTICA GOOGLE (Kazakh → English)
Pressione 'c' para capturar uma imagem e gerar a legenda
Pressione 'ESC' para sair
"""
import torch
import torchvision
import pickle
import cv2
from argparse import Namespace
from PIL import Image as PIL_Image
from models.End_ExpansionNet_v2 import End_ExpansionNet_v2
from utils.language_utils import convert_vector_idx2word
from time import time
import os
from deep_translator import GoogleTranslator

# Inicializar tradutor (Kazakh → English)
translator = GoogleTranslator(source='kk', target='en')  # 'kk' = Kazakh

# Configurações do modelo - USANDO VOCABULÁRIO KAZAKH (original)
load_path = 'checkpoints/kaz_model.pth'
dict_path = 'vocabulary/vocab_kz.pickle'  # Modelo treinado em Kazakh
img_size = 384

print("🔄 Carregando dicionário Kazakh...")
with open(dict_path, 'rb') as f:
    coco_tokens = pickle.load(f)
print("✅ Dicionário carregado!")
print("🌐 Tradutor Google (Kazakh → English) pronto!")

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

# Configurar dispositivo (CUDA ou CPU)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🖥️  Usando dispositivo: {device}")
model.to(device)

# Carregar checkpoint
if not os.path.exists(load_path):
    print(f"❌ ERRO: Checkpoint não encontrado em {load_path}")
    print("📥 Faça o download do modelo em: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0")
    exit(1)

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

# Configurações do beam search
beam_search_kwargs = {
    'beam_size': 5,
    'beam_max_seq_len': 63,
    'sample_or_max': 'max',
    'how_many_outputs': 1,
    'sos_idx': coco_tokens['word2idx_dict'][coco_tokens['sos_str']],
    'eos_idx': coco_tokens['word2idx_dict'][coco_tokens['eos_str']]
}

def cv2_to_pil(img):
    """Converte imagem OpenCV para PIL"""
    return PIL_Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

def translate_to_english(kazakh_text):
    """Traduz texto do Kazakh para Inglês usando Google Translate"""
    try:
        english_text = translator.translate(kazakh_text)
        return english_text
    except Exception as e:
        print(f"⚠️  Erro na tradução: {e}")
        return kazakh_text  # Retorna original se falhar

def generate_caption(img):
    """Gera legenda para uma imagem"""
    print("\n🤖 Gerando legenda...")
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
    caption_kazakh = ' '.join(pred).capitalize()
    
    stop = time()
    
    # Traduzir para inglês
    print("🌐 Traduzindo para inglês...")
    caption_english = translate_to_english(caption_kazakh)
    
    print(f'📝 Original (Kazakh): {caption_kazakh}')
    print(f'🇺🇸 Tradução (English): {caption_english}')
    print(f'⏱️  Tempo total: {time()-start:.4f}s\n')
    
    return caption_kazakh, caption_english

def main():
    """Função principal"""
    # Criar pasta de resultados se não existir
    results_dir = 'results'
    if not os.path.exists(results_dir):
        os.makedirs(results_dir)
        print(f"📁 Pasta '{results_dir}/' criada para salvar resultados")
    
    # Tentar abrir a webcam (índice 0 é a webcam padrão)
    print("🎥 Tentando abrir a webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Erro ao abrir a webcam!")
        print("💡 Certifique-se de que sua webcam está conectada e não está sendo usada por outro programa.")
        return
    
    print("✅ Webcam aberta com sucesso!")
    print("\n" + "="*60)
    print("INSTRUÇÕES:")
    print("  👉 Pressione 'c' ou 'ESPAÇO' para capturar e gerar legenda")
    print("  👉 Legendas: Kazakh (original) + English (Google Translate)")
    print("  👉 Pressione 'ESC' ou 'q' para sair")
    print("="*60 + "\n")
    
    capture_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("❌ Erro ao capturar frame da webcam")
                break
            
            # Mostrar o frame com instruções
            display_frame = frame.copy()
            cv2.putText(display_frame, "Pressione 'c' ou ESPACO para capturar", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(display_frame, "Auto-translate: Kazakh -> English", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(display_frame, "Pressione 'ESC' ou 'q' para sair", 
                       (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            cv2.imshow("Webcam - Auto Translation (KZ->EN)", display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            
            # ESC ou 'q' para sair
            if key == 27 or key == ord('q'):
                print("👋 Encerrando...")
                break
            
            # 'c' ou ESPAÇO para capturar
            elif key == ord('c') or key == 32:
                capture_count += 1
                print(f"\n📸 Captura #{capture_count}")
                
                # Salvar a imagem capturada
                capture_filename = os.path.join(results_dir, f'captured_translated_{capture_count}.jpg')
                cv2.imwrite(capture_filename, frame)
                print(f"💾 Imagem salva: {capture_filename}")
                
                # Gerar legenda e traduzir
                caption_kz, caption_en = generate_caption(frame)
                
                # Mostrar resultado em uma janela separada
                result_frame = frame.copy()
                
                # Adicionar fundo para o texto
                overlay = result_frame.copy()
                cv2.rectangle(overlay, (0, result_frame.shape[0] - 130), 
                            (result_frame.shape[1], result_frame.shape[0]), 
                            (0, 0, 0), -1)
                cv2.addWeighted(overlay, 0.7, result_frame, 0.3, 0, result_frame)
                
                # Adicionar legendas na imagem
                y_offset = result_frame.shape[0] - 100
                
                # Kazakh (original)
                cv2.putText(result_frame, "KZ:", 
                          (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 200, 0), 2)
                kz_text = caption_kz[:55] if len(caption_kz) > 55 else caption_kz
                cv2.putText(result_frame, kz_text, 
                          (60, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                
                # English (traduzido)
                cv2.putText(result_frame, "EN:", 
                          (10, y_offset + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                en_text = caption_en[:55] if len(caption_en) > 55 else caption_en
                cv2.putText(result_frame, en_text, 
                          (60, y_offset + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                
                cv2.imshow(f"Result #{capture_count}", result_frame)
                
                # Salvar resultado
                result_filename = os.path.join(results_dir, f'result_translated_{capture_count}.jpg')
                cv2.imwrite(result_filename, result_frame)
                print(f"💾 Resultado salvo: {result_filename}")
                
                # Salvar legendas em arquivo
                caption_filename = os.path.join(results_dir, f'caption_translated_{capture_count}.txt')
                with open(caption_filename, 'w', encoding='utf-8') as f:
                    f.write(f"Kazakh:  {caption_kz}\n")
                    f.write(f"English: {caption_en}\n")
                print(f"📝 Legendas salvas: {caption_filename}")
                
    except KeyboardInterrupt:
        print("\n⚠️  Interrompido pelo usuário")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("\n✅ Recursos liberados. Programa finalizado.")

if __name__ == "__main__":
    main()
