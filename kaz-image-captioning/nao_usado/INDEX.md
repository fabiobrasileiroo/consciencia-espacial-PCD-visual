# 📑 Índice Completo - Image Captioning Project

## 🚀 Início Rápido

### Opção 1: Instalação Automática (Recomendado)

```bash
bash install.sh
```

### Opção 2: Instalação Manual

Siga o guia: [INSTALL.md](INSTALL.md)

### Opção 3: Docker

```bash
docker-compose build
docker-compose up webcam-translate
```

---

## 📚 Documentação por Tópico

### 🇧🇷 Para Usuários de Português

| Arquivo                                  | Quando Usar                    |
| ---------------------------------------- | ------------------------------ |
| **[INSTALL.md](INSTALL.md)**             | Primeira instalação do projeto |
| **[GUIA_TESTE_PT.md](GUIA_TESTE_PT.md)** | Guia completo e detalhado      |
| **[RESUMO_RAPIDO.md](RESUMO_RAPIDO.md)** | Precisa de início rápido       |
| **[COMANDOS.md](COMANDOS.md)**           | Precisa copiar comandos        |
| **[FAQ_PT.md](FAQ_PT.md)**               | Tem dúvidas ou problemas       |

### 🐳 Para Usuários Docker

| Arquivo                                      | Quando Usar                |
| -------------------------------------------- | -------------------------- |
| **[DOCKER.md](DOCKER.md)**                   | Quer usar com Docker       |
| **[Dockerfile](Dockerfile)**                 | Ver configuração da imagem |
| **[docker-compose.yml](docker-compose.yml)** | Ver serviços disponíveis   |

### 🧪 Para Testar o Projeto

| Script                      | Descrição                     |
| --------------------------- | ----------------------------- |
| `test_webcam_translated.py` | ⭐ Webcam com tradução KZ→EN  |
| `test_webcam.py`            | Webcam com legendas em Kazakh |
| `test_esp32cam.py`          | Streaming do ESP32-CAM        |
| `test_single_image.py`      | Processar uma imagem          |

### 🔧 Para Desenvolvedores

| Pasta     | Conteúdo                     |
| --------- | ---------------------------- |
| `models/` | Arquitetura do modelo neural |
| `utils/`  | Funções utilitárias          |
| `data/`   | Carregadores de dados        |
| `eval/`   | Métricas de avaliação        |
| `losses/` | Funções de perda             |

---

## 📖 Guias por Caso de Uso

### Caso 1: "Nunca usei, quero começar"

1. Leia: [INSTALL.md](INSTALL.md)
2. Execute: `bash install.sh`
3. Teste: `source venv/bin/activate && python3 test_webcam_translated.py`

### Caso 2: "Quero usar com webcam"

1. Execute: `source venv/bin/activate`
2. Execute: `python3 test_webcam_translated.py`
3. Pressione 'c' para capturar

### Caso 3: "Quero usar com ESP32-CAM"

1. Configure ESP32: Veja [GUIA_TESTE_PT.md](GUIA_TESTE_PT.md) seção ESP32
2. Execute: `python3 test_esp32cam.py --url http://IP:81/stream`

### Caso 4: "Quero processar imagens"

1. Coloque imagens em `examples/`
2. Execute: `python3 test_single_image.py examples/imagem.jpg`

### Caso 5: "Quero usar Docker"

1. Leia: [DOCKER.md](DOCKER.md)
2. Build: `docker-compose build`
3. Execute: `docker-compose up webcam-translate`

### Caso 6: "Tenho problemas"

1. Leia: [FAQ_PT.md](FAQ_PT.md)
2. Execute: `python3 setup_check.py`
3. Veja logs de erro

---

## 🎯 Arquivos Principais

### Configuração

- `requirements.txt` - Dependências Python
- `Dockerfile` - Configuração Docker
- `docker-compose.yml` - Serviços Docker
- `.dockerignore` - Arquivos excluídos do build

### Scripts de Instalação

- `install.sh` - Instalação automática
- `setup_check.py` - Verificação do ambiente
- `verificar_ambiente.sh` - Verificação bash

### Scripts de Teste

- `test_webcam_translated.py` ⭐ - Webcam com tradução
- `test_webcam.py` - Webcam (Kazakh)
- `test_esp32cam.py` - ESP32-CAM streaming
- `test_single_image.py` - Processar imagem

### Documentação

- `README.md` - Documentação principal
- `INSTALL.md` - Guia de instalação
- `DOCKER.md` - Guia Docker
- `GUIA_TESTE_PT.md` - Guia completo (PT-BR)
- `FAQ_PT.md` - Perguntas frequentes
- `COMANDOS.md` - Referência de comandos
- `RESUMO_RAPIDO.md` - Início rápido
- `ESTRUTURA_PROJETO.md` - Estrutura de arquivos

### Hardware

- `ESP32_CAM_Stream.ino` - Código Arduino

### Modelo e Dados

- `checkpoints/kaz_model.pth` - Modelo treinado (BAIXAR)
- `vocabulary/vocab_kz.pickle` - Vocabulário Kazakh
- `vocabulary/vocab_en.pickle` - Vocabulário English
- `examples/` - Imagens de exemplo

---

## 🔍 Busca Rápida

### "Como instalo?"

→ [INSTALL.md](INSTALL.md)

### "Como uso com Docker?"

→ [DOCKER.md](DOCKER.md)

### "Tenho um erro..."

→ [FAQ_PT.md](FAQ_PT.md)

### "Quais comandos usar?"

→ [COMANDOS.md](COMANDOS.md)

### "Como funciona o projeto?"

→ [GUIA_TESTE_PT.md](GUIA_TESTE_PT.md)

### "Onde estão os exemplos?"

→ `examples/README.md`

### "Como configurar ESP32?"

→ [GUIA_TESTE_PT.md](GUIA_TESTE_PT.md) → Seção ESP32-CAM

---

## 📊 Fluxograma de Decisão

```
┌─────────────────────────────┐
│  Você tem Docker instalado? │
└────────┬───────────┬────────┘
         │           │
      SIM│           │NÃO
         │           │
         ▼           ▼
    ┌────────┐  ┌─────────────┐
    │DOCKER  │  │ INSTALAÇÃO  │
    │  .md   │  │   NATIVA    │
    └────────┘  └──────┬──────┘
                       │
                       ▼
              ┌────────────────┐
              │  INSTALL.md    │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ install.sh     │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │  TESTE WEBCAM  │
              └────────────────┘
```

---

## 🆘 Suporte

1. **Primeiro**: Leia [FAQ_PT.md](FAQ_PT.md)
2. **Depois**: Execute `python3 setup_check.py`
3. **Se ainda tiver problemas**:
   - Veja [GUIA_TESTE_PT.md](GUIA_TESTE_PT.md) → Solução de Problemas
   - Issues: https://github.com/IS2AI/kaz-image-captioning/issues

---

## 📝 Checklist de Início

- [ ] Baixei o modelo `kaz_model.pth`
- [ ] Coloquei em `checkpoints/kaz_model.pth`
- [ ] Executei `bash install.sh` OU segui `INSTALL.md`
- [ ] Executei `python3 setup_check.py` (tudo OK)
- [ ] Testei com `python3 test_webcam_translated.py`
- [ ] Funciona! 🎉

---

**Tudo pronto para começar! 🚀**
