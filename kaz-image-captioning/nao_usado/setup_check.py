#!/usr/bin/env python3
"""
Script de Configuração Inicial - Image Captioning
Este script ajuda a verificar e configurar o ambiente
"""
import os
import sys

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def check_python():
    print_header("1️⃣  Verificando Python")
    print(f"✅ Python {sys.version.split()[0]}")
    if sys.version_info < (3, 7):
        print("❌ ERRO: Python 3.7 ou superior é necessário!")
        return False
    return True

def check_imports():
    print_header("2️⃣  Verificando Bibliotecas")
    
    libs = {
        'torch': 'PyTorch',
        'torchvision': 'TorchVision',
        'cv2': 'OpenCV',
        'numpy': 'NumPy',
        'PIL': 'Pillow',
        'h5py': 'h5py',
        'scipy': 'SciPy'
    }
    
    all_ok = True
    for lib, name in libs.items():
        try:
            module = __import__(lib)
            version = getattr(module, '__version__', 'OK')
            print(f"✅ {name}: {version}")
        except ImportError:
            print(f"❌ {name}: NÃO INSTALADO")
            all_ok = False
    
    return all_ok

def check_cuda():
    print_header("3️⃣  Verificando CUDA/GPU")
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ CUDA disponível")
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
            print(f"   Memória: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        else:
            print("⚠️  CUDA não disponível - usando CPU")
            print("   (O processamento será mais lento)")
    except:
        print("❌ Erro ao verificar CUDA")

def check_files():
    print_header("4️⃣  Verificando Arquivos")
    
    files = {
        'checkpoints/kaz_model.pth': 'Modelo treinado (CRÍTICO)',
        'vocabulary/vocab_kz.pickle': 'Dicionário Kazakh (CRÍTICO)',
        'test_webcam.py': 'Script de teste webcam',
        'test_esp32cam.py': 'Script de teste ESP32-CAM',
        'test_single_image.py': 'Script de teste imagem única',
    }
    
    all_ok = True
    for file, desc in files.items():
        if os.path.exists(file):
            size = os.path.getsize(file)
            size_str = f"{size/1e6:.1f}MB" if size > 1e6 else f"{size/1e3:.1f}KB"
            print(f"✅ {desc}")
            print(f"   {file} ({size_str})")
        else:
            print(f"❌ {desc}")
            print(f"   {file} (NÃO ENCONTRADO)")
            if 'CRÍTICO' in desc:
                all_ok = False
    
    return all_ok

def check_webcam():
    print_header("5️⃣  Verificando Webcam")
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            print("✅ Webcam detectada e funcional")
            cap.release()
        else:
            print("⚠️  Webcam não detectada ou em uso")
    except Exception as e:
        print(f"❌ Erro ao verificar webcam: {e}")

def print_instructions():
    print_header("📋 Próximos Passos")
    
    print("\n🔧 Se faltam bibliotecas:")
    print("   pip3 install torch torchvision opencv-python numpy Pillow h5py scipy")
    
    print("\n📥 Se falta o modelo:")
    print("   1. Acesse: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0")
    print("   2. Baixe: kaz_model.pth (~2.7GB)")
    print("   3. Coloque em: checkpoints/kaz_model.pth")
    
    print("\n🧪 Para testar:")
    print("   Webcam:      python3 test_webcam.py")
    print("   ESP32-CAM:   python3 test_esp32cam.py --url http://IP:81/stream")
    print("   Imagem:      python3 test_single_image.py imagem.jpg")
    
    print("\n📖 Documentação completa:")
    print("   GUIA_TESTE_PT.md - Guia completo em português")
    print("   RESUMO_RAPIDO.md - Resumo rápido")
    print("   COMANDOS.md      - Comandos prontos")

def main():
    print("\n" + "🚀 "*20)
    print("   IMAGE CAPTIONING - CONFIGURAÇÃO INICIAL")
    print("🚀 "*20)
    
    checks = []
    
    checks.append(check_python())
    checks.append(check_imports())
    check_cuda()
    checks.append(check_files())
    check_webcam()
    
    print_header("📊 Resumo")
    
    if all(checks):
        print("\n✅ TUDO OK! Você está pronto para testar!")
        print("\n🎉 Execute um dos comandos abaixo:")
        print("   python3 test_webcam.py")
        print("   python3 test_esp32cam.py --url http://SEU_IP:81/stream")
        print("   python3 test_single_image.py imagem.jpg")
        return 0
    else:
        print("\n⚠️  Alguns problemas foram encontrados.")
        print_instructions()
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        print("\n" + "="*60 + "\n")
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrompido pelo usuário")
        sys.exit(1)
