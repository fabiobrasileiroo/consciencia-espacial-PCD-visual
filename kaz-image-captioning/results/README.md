# 📁 Pasta de Resultados

Esta pasta armazena automaticamente todos os resultados gerados pelos scripts de teste.

## 📂 Conteúdo

### 🎥 Webcam com Tradução (`test_webcam_translated.py`)

- `captured_translated_N.jpg` - Imagem original capturada
- `result_translated_N.jpg` - Imagem com legendas (Kazakh + English)
- `caption_translated_N.txt` - Arquivo de texto com as legendas

**Exemplo de arquivo de texto:**

```
Kazakh:  Көк көйлек киген адам.
English: The man in the blue shirt.
```

---

### 🎥 Webcam Original (`test_webcam.py`)

- `captured_frame_N.jpg` - Imagem original capturada
- `result_N.jpg` - Imagem com legenda em Kazakh
- `caption_N.txt` - Arquivo de texto com a legenda

**Exemplo de arquivo de texto:**

```
Көк көйлек киген адам.
```

---

### 📷 ESP32-CAM (`test_esp32cam.py`)

- `esp32_captured_N.jpg` - Imagem original capturada do stream
- `esp32_result_N.jpg` - Imagem com legenda em Kazakh
- `esp32_caption_N.txt` - Arquivo de texto com a legenda

**Exemplo de arquivo de texto:**

```
Үстелде ноутбук бар.
```

---

## 📊 Estrutura de Nomenclatura

Todos os arquivos seguem o padrão:

```
[prefixo]_[tipo]_[número].[extensão]

Prefixos:
- captured_translated - Webcam com tradução (original)
- result_translated    - Webcam com tradução (com legendas)
- caption_translated   - Webcam com tradução (texto)
- captured_frame       - Webcam Kazakh (original)
- result               - Webcam Kazakh (com legendas)
- caption              - Webcam Kazakh (texto)
- esp32_captured       - ESP32-CAM (original)
- esp32_result         - ESP32-CAM (com legendas)
- esp32_caption        - ESP32-CAM (texto)

Número: Contador sequencial (1, 2, 3, ...)
```

---

## 🗑️ Limpeza

Para limpar todos os resultados:

```bash
# Linux/Mac
rm -rf results/*

# Ou manualmente, deletando os arquivos individualmente
```

---

## 📝 Notas

- Esta pasta é criada automaticamente na primeira execução
- Os arquivos são numerados sequencialmente durante cada sessão
- As imagens são salvas em formato JPEG
- Os textos são salvos em UTF-8 para suportar caracteres Kazakh e outros idiomas

---

**Última atualização:** Novembro 2025
