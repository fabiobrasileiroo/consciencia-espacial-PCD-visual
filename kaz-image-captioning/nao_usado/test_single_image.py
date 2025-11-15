"""
Script simples para testar o modelo com uma única imagem
Uso: python3 test_single_image.py caminho/para/imagem.jpg
"""
import torch
import torchvision
import pickle
import sys
import os
from argparse import Namespace
from PIL import Image as PIL_Image
from models.End_ExpansionNet_v2 import End_ExpansionNet_v2
from utils.language_utils import convert_vector_idx2word
from time import time

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python3 test_single_image.py caminho/para/imagem.jpg")
        print("\n📝 Exemplos:")
        print("   python3 test_single_image.py example_images/test.jpg")
        print("   python3 test_single_image.py captured_frame_1.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(f"❌ Erro: Arquivo '{image_path}' não encontrado!")
        sys.exit(1)
    
    print(f"🖼️  Carregando imagem: {image_path}")
    
    # Configurações
    load_path = 'checkpoints/kaz_model.pth'
    dict_path = 'vocabulary/vocab_kz.pickle'
    img_size = 384
    
    # Verificar se os arquivos necessários existem
    if not os.path.exists(load_path):
        print(f"❌ ERRO: Checkpoint não encontrado em {load_path}")
        print("📥 Faça o download do modelo em:")
        print("   https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0")
        sys.exit(1)
    
    if not os.path.exists(dict_path):
        print(f"❌ ERRO: Dicionário não encontrado em {dict_path}")
        sys.exit(1)
    
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
    
    # Configurar dispositivo
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"🖥️  Usando dispositivo: {device}")
    model.to(device)
    
    # Carregar checkpoint
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
    
    # Carregar e processar imagem
    print("\n🤖 Gerando legenda...")
    start = time()
    
    try:
        pil_image = PIL_Image.open(image_path).convert('RGB')
    except Exception as e:
        print(f"❌ Erro ao abrir imagem: {e}")
        sys.exit(1)
    
    preprocess_pil_image = transf_1(pil_image)
    tens_image_1 = torchvision.transforms.ToTensor()(preprocess_pil_image)
    tens_image_2 = transf_2(tens_image_1)
    
    image = tens_image_2.unsqueeze(0).to(device)
    
    # Gerar legenda
    with torch.no_grad():
        pred, _ = model(
            enc_x=image,
            enc_x_num_pads=[0],
            mode='beam_search',
            **beam_search_kwargs
        )
    
    pred = convert_vector_idx2word(pred[0][0], coco_tokens['idx2word_list'])[1:-1]
    pred[-1] = pred[-1] + '.'
    caption = ' '.join(pred).capitalize()
    
    stop = time()
    
    print("\n" + "="*60)
    print(f"📝 Legenda: {caption}")
    print("="*60)
    print(f"⏱️  Tempo de processamento: {stop-start:.4f}s")
    print(f"🖼️  Imagem: {image_path}")
    print(f"💾 Salvo em: caption_result.txt")
    
    # Salvar resultado em arquivo
    with open('caption_result.txt', 'w', encoding='utf-8') as f:
        f.write(f"Imagem: {image_path}\n")
        f.write(f"Legenda: {caption}\n")
        f.write(f"Tempo: {stop-start:.4f}s\n")
    
    print("\n✅ Processamento concluído!")

if __name__ == "__main__":
    main()
