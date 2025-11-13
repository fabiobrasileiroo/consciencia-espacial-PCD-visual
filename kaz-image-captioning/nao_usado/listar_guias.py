#!/usr/bin/env python3
"""
Script para mostrar todos os guias e documentações disponíveis
Execute: python3 listar_guias.py
"""

import os
from pathlib import Path

def print_banner():
    print("\n" + "="*70)
    print("  📚 GUIAS E DOCUMENTAÇÃO DISPONÍVEIS")
    print("="*70 + "\n")

def print_file_info(filename, description, emoji, size_mb=None):
    exists = os.path.exists(filename)
    status = "✅" if exists else "❌"
    
    size_info = ""
    if exists and size_mb:
        size = os.path.getsize(filename)
        if size > 1e6:
            size_info = f" ({size/1e6:.1f}MB)"
        elif size > 1e3:
            size_info = f" ({size/1e3:.0f}KB)"
    
    print(f"{status} {emoji} {filename:30s} {size_info}")
    print(f"   └─ {description}")
    print()

def main():
    print_banner()
    
    print("🇧🇷 DOCUMENTAÇÃO EM PORTUGUÊS (COMECE AQUI!)")
    print("-" * 70)
    print_file_info(
        "INICIO_RAPIDO.txt",
        "Visual guide - Resumo completo em formato visual",
        "🎯"
    )
    print_file_info(
        "RESUMO_RAPIDO.md",
        "Quick start - Passo a passo rápido para começar",
        "⚡"
    )
    print_file_info(
        "GUIA_TESTE_PT.md",
        "Guia completo - Tudo explicado em detalhes",
        "📖"
    )
    print_file_info(
        "COMANDOS.md",
        "Comandos prontos - Copiar e colar",
        "📝"
    )
    print_file_info(
        "FAQ_PT.md",
        "Perguntas frequentes - Dúvidas comuns respondidas",
        "❓"
    )
    print_file_info(
        "ESTRUTURA_PROJETO.md",
        "Mapa visual - Entenda os arquivos do projeto",
        "📂"
    )
    
    print("\n" + "="*70)
    print("🧪 SCRIPTS DE TESTE")
    print("-" * 70)
    print_file_info(
        "test_webcam.py",
        "Teste com webcam do notebook/USB",
        "🎥"
    )
    print_file_info(
        "test_esp32cam.py",
        "Teste com ESP32-CAM ou câmera IP",
        "📡"
    )
    print_file_info(
        "test_single_image.py",
        "Teste com uma única imagem estática",
        "🖼️"
    )
    print_file_info(
        "setup_check.py",
        "Verificação inicial do ambiente",
        "✅"
    )
    print_file_info(
        "verificar_ambiente.sh",
        "Script bash de verificação",
        "🔧"
    )
    
    print("\n" + "="*70)
    print("🔧 HARDWARE")
    print("-" * 70)
    print_file_info(
        "ESP32_CAM_Stream.ino",
        "Código Arduino para ESP32-CAM",
        "📟"
    )
    
    print("\n" + "="*70)
    print("🤖 MODELO E DADOS")
    print("-" * 70)
    print_file_info(
        "checkpoints/kaz_model.pth",
        "Modelo treinado (CRÍTICO - 2.7GB)",
        "⚠️",
        size_mb=True
    )
    print_file_info(
        "vocabulary/vocab_kz.pickle",
        "Dicionário Kazakh (necessário)",
        "📚",
        size_mb=True
    )
    
    print("\n" + "="*70)
    print("📖 DOCUMENTAÇÃO ORIGINAL")
    print("-" * 70)
    print_file_info(
        "README.md",
        "Documentação principal do projeto",
        "📄"
    )
    print_file_info(
        "requirements.txt",
        "Lista de dependências Python",
        "📋"
    )
    
    print("\n" + "="*70)
    print("💡 RECOMENDAÇÕES")
    print("="*70)
    print("""
    1️⃣  PRIMEIRO: Leia INICIO_RAPIDO.txt ou RESUMO_RAPIDO.md
    
    2️⃣  DEPOIS: Execute setup_check.py para verificar instalação
    
    3️⃣  DÚVIDAS: Consulte FAQ_PT.md ou GUIA_TESTE_PT.md
    
    4️⃣  COMANDOS: Use COMANDOS.md para copiar comandos prontos
    
    5️⃣  TESTAR: Execute test_webcam.py ou test_esp32cam.py
    """)
    
    print("="*70)
    print("📥 LEMBRE-SE: Baixe o modelo!")
    print("-" * 70)
    print("Link: https://drive.google.com/drive/folders/16PDZvoNs3P-O9Vr3zEb6bb-aaSDOiSY0")
    print("Arquivo: kaz_model.pth (2.7GB)")
    print("Destino: checkpoints/kaz_model.pth")
    print("="*70 + "\n")
    
    # Verificar se o modelo existe
    if not os.path.exists("checkpoints/kaz_model.pth"):
        print("⚠️  ATENÇÃO: Modelo não encontrado!")
        print("   O projeto NÃO funcionará sem o modelo treinado.")
        print("   Baixe do link acima antes de prosseguir.\n")
    else:
        print("✅ Modelo encontrado! Você está pronto para começar.\n")

if __name__ == "__main__":
    main()
