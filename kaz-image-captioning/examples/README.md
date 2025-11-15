# 📸 Pasta de Exemplos

Esta pasta contém imagens de exemplo para testar o modelo de Image Captioning.

## 🖼️ Como usar os exemplos

### Método 1: Linha de comando

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Processar exemplo
python3 test_single_image.py examples/example_1.jpg
```

### Método 2: Docker

```bash
# Copie sua imagem para esta pasta
cp minha_imagem.jpg examples/

# Execute com Docker
docker-compose run single-image python3 test_single_image.py /app/input/minha_imagem.jpg
```

## 📁 Adicionar suas próprias imagens

Basta copiar suas imagens para esta pasta:

```bash
cp /caminho/para/sua/imagem.jpg examples/
```

## 🎯 Formatos suportados

- `.jpg` / `.jpeg`
- `.png`
- `.bmp`
- `.tiff`

## 📝 Resultados

Os resultados serão salvos na pasta raiz do projeto:

- `caption_result.txt` - Legenda gerada
- Imagens processadas com legendas sobrepostas

## 💡 Dicas

1. **Melhor iluminação** = melhores resultados
2. **Imagens claras** funcionam melhor
3. **Objetos comuns** (pessoas, móveis, etc.) têm melhores descrições
4. O modelo foi treinado em **Kazakh**, use `test_webcam_translated.py` para ter traduções em inglês

## 🌐 Fontes de imagens de teste

Você pode usar imagens de:

- Sua câmera/celular
- Banco de imagens livres (Unsplash, Pexels)
- Dataset COCO (imagens de exemplo)

---

**Coloque suas imagens aqui e teste o modelo!** 🚀
