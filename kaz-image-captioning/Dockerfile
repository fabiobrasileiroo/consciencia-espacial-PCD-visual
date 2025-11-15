FROM python:3.10-slim

# Metadados
LABEL maintainer="Image Captioning Project"
LABEL description="Image Captioning with Kazakh to English translation"

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    torch==2.0.0 \
    torchvision==0.15.0 \
    opencv-python-headless==4.8.0.74 \
    h5py==3.9.0 \
    scipy==1.11.1 \
    numpy==1.24.3 \
    Pillow==10.0.0 \
    deep-translator==1.11.4

# Copiar código do projeto
COPY models/ ./models/
COPY utils/ ./utils/
COPY data/ ./data/
COPY vocabulary/ ./vocabulary/
COPY test_webcam.py .
COPY test_webcam_translated.py .
COPY test_single_image.py .
COPY setup_check.py .

# Criar diretório para checkpoints (será montado como volume)
RUN mkdir -p checkpoints

# Variável de ambiente para OpenCV
ENV DISPLAY=:0

# Porta padrão (se necessário para streaming)
EXPOSE 8080

# Comando padrão
CMD ["python3", "test_webcam_translated.py"]
