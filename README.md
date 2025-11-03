# 🚀 Sistema de Detecção de Objetos com ESP32
<img width="1500" height="1125" alt="iPhone 16" src="https://github.com/user-attachments/assets/fdac1e1a-cae8-4143-9a42-3346d0985ab8" />
<img width="1463" height="1139" alt="Diagrama visual" src="https://github.com/user-attachments/assets/d0dd161d-42b6-439d-b030-470a401e6ada" />

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-6.8.1-orange.svg)](https://platformio.org)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-green.svg)](https://github.com/espressif/arduino-esp32)

> Sistema de assistência para detecção de obstáculos usando ESP32, ESP-NOW, sensor HC-SR04 e feedback tátil.
![Uploading iPhone 16.svg…]()

## ✨ Características

- 📡 **Comunicação sem fio** ESP-NOW entre 3 módulos
- 📏 **Medição precisa** de distância (2-400cm)
- 🔊 **Feedback tátil** proporcional à distância
- ⚡ **Baixa latência** (~10ms)
- 🔋 **Eficiência energética** (~80mA por módulo)
- 🎨 **PWM** para controle de intensidade

## 🏗️ Arquitetura

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Módulo 1   │         │  ESP32-PAI   │         │   Módulo 3   │
│              │ ESP-NOW │   (Mestre)   │ ESP-NOW │              │
│ HC-SR04      ├────────►│              ├────────►│ Motor 1027   │
│ (Sensor)     │         │  Processa    │         │ (Vibração)   │
└──────────────┘         └──────────────┘         └──────────────┘
```

### Fluxo de Dados

1. **Módulo 1** mede distância a cada 500ms
2. **ESP32-PAI** recebe e calcula intensidade:
   - `< 20cm` → 🔴 FORTE (100%)
   - `20-50cm` → 🟠 MÉDIA (60%)
   - `50-100cm` → 🟡 BAIXA (30%)
   - `> 100cm` → ⚪ PARADO
3. **Módulo 3** vibra conforme comando recebido

## 📁 Estrutura do Projeto

```
sistema_de_dectacao_de_objetos/
│
├── firmware/                    # Código dos ESP32
│   ├── modulo1-sensor/         # Sensor HC-SR04
│   ├── esp32-pai-mestre/       # Controlador central
│   └── modulo3-motor/          # Motor de vibração
│
├── docs/                        # Documentação
│   ├── README_HARDWARE.md      # Conexões e esquemas
│   ├── README_CONFIGURACAO.md  # Setup detalhado
│   └── TROUBLESHOOTING.md      # Solução de problemas
│
├── hardware/                    # Esquemas físicos
│   ├── esquematico.md
│   └── pcb/                    # (futuro)
│
├── examples/                    # Testes e exemplos
│   ├── teste-sensor/
│   ├── teste-motor/
│   └── teste-espnow/
│
├── app/                         # Interface móvel
│   └── pcd-visual-app/         # React Native
│
└── deprecated/                  # Código antigo
```

## 🚀 Início Rápido

### Pré-requisitos

- [PlatformIO](https://platformio.org/install) instalado
- VS Code (recomendado)
- 3x ESP32 DevKit
- 1x Sensor HC-SR04
- 1x Motor vibracall 1027
- 1x Transistor NPN + 1x Resistor 1kΩ

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos.git
cd sistema_de_dectacao_de_objetos

# 2. Compile e faça upload no Módulo 1
cd firmware/modulo1-sensor
pio run -t upload

# 3. Compile e faça upload no ESP32-PAI
cd ../esp32-pai-mestre
pio run -t upload

# 4. Compile e faça upload no Módulo 3
cd ../modulo3-motor
pio run -t upload
```

### Configuração dos MACs

Após primeiro upload, anote os MACs e configure:

```cpp
// firmware/modulo1-sensor/src/main.cpp (linha ~11)
uint8_t broadcastAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30}; // MAC do PAI

// firmware/esp32-pai-mestre/src/main.cpp (linhas ~7 e ~13)
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04}; // Módulo 1
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C}; // Módulo 3
```

Recompile e faça upload novamente após configurar os MACs.

## 🎮 Uso

### Monitorar Serial

```bash
# Abra 3 terminais diferentes para cada módulo
pio device monitor --port /dev/ttyUSB0 --baud 115200  # Módulo 1
pio device monitor --port /dev/ttyUSB1 --baud 115200  # ESP32-PAI
pio device monitor --port /dev/ttyUSB2 --baud 115200  # Módulo 3
```

### Testar Sistema

1. Aproxime objetos do sensor
2. Observe no Serial Monitor do PAI a distância detectada
3. Motor deve vibrar proporcionalmente!

## 📚 Documentação

| Documento                                             | Descrição                     |
| ----------------------------------------------------- | ----------------------------- |
| [README_HARDWARE.md](docs/README_HARDWARE.md)         | Conexões e esquemas elétricos |
| [README_CONFIGURACAO.md](docs/README_CONFIGURACAO.md) | Configuração passo a passo    |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)         | Solução de problemas          |
| [README_ESP32_SISTEMA.md](README_ESP32_SISTEMA.md)    | Guia completo original        |

## 🛠️ Tecnologias

- **Hardware:** ESP32, HC-SR04, Motor 1027
- **Framework:** Arduino (ESP-IDF)
- **Protocolo:** ESP-NOW
- **Build:** PlatformIO
- **App:** React Native + Expo (em desenvolvimento)

## 📊 Especificações

| Módulo    | GPIO Usados | Consumo | Alcance |
| --------- | ----------- | ------- | ------- |
| Módulo 1  | 33, 25      | ~80mA   | 2-400cm |
| ESP32-PAI | -           | ~70mA   | -       |
| Módulo 3  | 4 (PWM)     | ~100mA  | -       |

**Alcance ESP-NOW:** ~200m em campo aberto  
**Latência:** ~10ms  
**Taxa de atualização:** 2Hz (500ms)

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🐛 Reportar Problemas

Encontrou um bug? [Abra uma issue](https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos/issues)

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Fábio Brasileiro**

- GitHub: [@fabiobrasileiroo](https://github.com/fabiobrasileiroo)
- Email: seu-email@exemplo.com

## 🙏 Agradecimentos

- Comunidade [PlatformIO](https://platformio.org/)
- [Espressif Systems](https://www.espressif.com/) pelo ESP32
- Comunidade Arduino

## 📈 Roadmap

- [x] Sistema básico funcionando
- [x] PWM para controle de intensidade
- [ ] Interface móvel completa
- [ ] Modo de economia de energia
- [ ] Calibração automática
- [ ] Múltiplos sensores
- [ ] Dashboard web
- [ ] Integração com assistentes (Alexa, Google)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=fabiobrasileiroo/sistema_de_dectacao_de_objetos&type=Date)](https://star-history.com/#fabiobrasileiroo/sistema_de_dectacao_de_objetos&Date)

---

<div align="center">

**Status:** 🟢 Ativo e em desenvolvimento

**Versão:** 1.0.0

**Última atualização:** 26 de outubro de 2025

Feito com ❤️ por [Fábio Brasileiro](https://github.com/fabiobrasileiroo)

</div>
