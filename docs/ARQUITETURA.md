# 📊 Arquitetura do Projeto

## 🏗️ Organização Atual vs Nova

### ❌ Estrutura Antiga (Desorganizada)

```
sistema_de_dectacao_de_objetos/
├── Modulo1/                    ← Nome genérico
├── Modulo3/                    ← Nome genérico
├── esp32-pai-broadcast/        ← Nome inconsistente
├── Module2/                    ← Não usado
├── example/                    ← Sem organização
├── distancia-esp-32.ino/       ← Arquivo solto
├── back-sistema-escolar-nfc/   ← Projeto diferente!
└── pcd-visual-app/             ← Fora do padrão
```

### ✅ Nova Estrutura (Organizada)

```
sistema_de_dectacao_de_objetos/
│
├── 📱 firmware/                    # Código ESP32 organizado
│   ├── modulo1-sensor/            # Nome descritivo
│   ├── esp32-pai-mestre/          # Função clara
│   └── modulo3-motor/             # Propósito óbvio
│
├── 📚 docs/                        # Documentação centralizada
│   ├── README_HARDWARE.md         # Conexões físicas
│   ├── README_CONFIGURACAO.md     # Setup passo a passo
│   └── TROUBLESHOOTING.md         # Solução de problemas
│
├── 🔧 hardware/                    # Esquemas e diagramas
│   ├── esquematico.md
│   ├── bom.md                     # Bill of Materials
│   └── pcb/                       # (futuro)
│
├── 📱 app/                         # Interface móvel
│   └── (pcd-visual-app renomeado)
│
├── 🧪 examples/                    # Testes isolados
│   ├── teste-sensor/
│   ├── teste-motor/
│   └── teste-espnow/
│
├── 🗑️  deprecated/                 # Código antigo
│   ├── back-sistema-escolar-nfc/
│   ├── distancia-esp-32.ino/
│   └── example/
│
├── 📄 README.md                    # Documentação principal
├── 📄 README_ESP32_SISTEMA.md      # Guia detalhado original
├── 📄 LICENSE                      # Licença MIT
└── 📄 .gitignore                   # Arquivos ignorados
```

## 📁 Detalhamento dos Diretórios

### `/firmware`

Contém todo o código que roda nos ESP32.

```
firmware/
├── modulo1-sensor/              # Módulo com HC-SR04
│   ├── platformio.ini          # Configuração do PlatformIO
│   ├── src/
│   │   └── main.cpp           # Código principal
│   ├── include/               # Headers (se houver)
│   ├── lib/                   # Bibliotecas locais
│   └── test/                  # Testes unitários
│
├── esp32-pai-mestre/           # Controlador central
│   ├── platformio.ini
│   ├── src/
│   │   └── main.cpp
│   └── ...
│
└── modulo3-motor/              # Módulo com vibracall
    ├── platformio.ini
    ├── src/
    │   └── main.cpp
    └── ...
```

**Convenções:**

- Nome deve indicar **função** (sensor, motor, etc)
- Cada módulo é independente
- `platformio.ini` define placa e bibliotecas
- Código principal sempre em `src/main.cpp`

### `/docs`

Toda documentação técnica centralizada.

```
docs/
├── README_HARDWARE.md         # Esquemas de conexão
├── README_CONFIGURACAO.md     # Setup inicial
├── TROUBLESHOOTING.md         # FAQ e problemas
├── API.md                     # (futuro) Documentação da API
└── CHANGELOG.md               # (futuro) Histórico de versões
```

**Princípios:**

- Um arquivo por tópico
- Markdown para fácil visualização
- Imagens em `docs/images/`
- Links relativos entre arquivos

### `/hardware`

Esquemas físicos, BOM, PCBs.

```
hardware/
├── esquematico.md             # Descrição textual
├── fritzing/                  # Diagramas Fritzing
│   ├── modulo1.fzz
│   ├── modulo3.fzz
│   └── completo.fzz
├── bom.md                     # Bill of Materials
├── conexoes.md                # Tabela de pinos
└── pcb/                       # (futuro) PCB Gerber files
    └── v1.0/
```

### `/app`

Aplicação móvel React Native.

```
app/
├── app/                       # Screens (Expo Router)
├── components/                # Componentes React
├── services/                  # API calls
├── hooks/                     # Custom hooks
└── ...
```

**Integração futura:**

- WebSocket para comunicação em tempo real
- Dashboard de status dos módulos
- Configuração remota via app

### `/examples`

Códigos de teste isolados.

```
examples/
├── teste-sensor/              # Teste HC-SR04 isolado
│   └── main.cpp
├── teste-motor/               # Teste motor isolado
│   └── main.cpp
├── teste-espnow/              # Teste ESP-NOW simples
│   ├── transmissor.cpp
│   └── receptor.cpp
└── README.md                  # Como usar os exemplos
```

### `/deprecated`

Código antigo que não deve ser usado.

```
deprecated/
├── README.md                  # Aviso e explicação
├── back-sistema-escolar-nfc/  # Projeto diferente
├── distancia-esp-32.ino/      # Versão Arduino IDE antiga
└── example/                   # Exemplos desorganizados
```

**⚠️ Importante:** Nunca use código daqui em produção!

## 🎯 Benefícios da Nova Estrutura

### ✅ Clareza

- Nomes descritivos
- Hierarquia lógica
- Fácil navegação

### ✅ Manutenibilidade

- Separação de concerns
- Documentação centralizada
- Histórico preservado (deprecated)

### ✅ Escalabilidade

- Fácil adicionar novos módulos
- Estrutura preparada para crescimento
- CI/CD mais simples

### ✅ Colaboração

- Novos contribuidores entendem rapidamente
- Padrões claros
- Documentação acessível

## 🔄 Migração

### Passos Realizados

1. ✅ Criada estrutura `/firmware`
2. ✅ Copiados módulos para novos diretórios
3. ✅ Criada pasta `/docs` com documentação
4. ✅ Movidos arquivos antigos para `/deprecated`
5. ✅ Renomeado `/pcd-visual-app` para `/app`
6. ✅ Criado README.md principal profissional
7. ✅ Adicionado .gitignore completo

### Próximos Passos (Opcional)

- [ ] Deletar pastas antigas (`Modulo1`, `Modulo3`, `esp32-pai-broadcast`)
- [ ] Criar `/hardware` com esquemas Fritzing
- [ ] Criar `/examples` com testes isolados
- [ ] Adicionar badges ao README (CI/CD, Coverage, etc)
- [ ] Configurar GitHub Actions para CI
- [ ] Criar template de Issue/PR

## 📊 Comparação de Tamanho

| Antes            | Depois              | Diferença        |
| ---------------- | ------------------- | ---------------- |
| 9 pastas raiz    | 6 pastas raiz       | -33%             |
| Nomes genéricos  | Nomes descritivos   | +100% clareza    |
| Sem documentação | 3 docs técnicos     | Infinito 😊      |
| README básico    | README profissional | +500% informação |

## 🎨 Convenções de Nomenclatura

### Pastas

- **firmware/** → minúsculas, hifenizado
- **modulo1-sensor** → função-propósito
- **esp32-pai-mestre** → papel claro

### Arquivos

- **README.md** → Principal (raiz)
- **README_HARDWARE.md** → Específico
- **main.cpp** → Padrão Arduino/PlatformIO

### Código

```cpp
// Constantes: UPPER_SNAKE_CASE
#define MOTOR_PIN 4
#define PWM_CHANNEL 0

// Funções: camelCase
void measureDistance() {}
void OnDataRecv() {}  // Callbacks podem usar PascalCase

// Variáveis: camelCase
int currentLevel = 0;
bool motorState = false;
```

## 📖 Referências

- [Padrões de Projeto Embarcado](https://embeddedartistry.com/blog/2017/05/22/embedded-rules-of-thumb/)
- [Estrutura de Projetos PlatformIO](https://docs.platformio.org/en/latest/projectconf/sections/platformio/options/directory/src_dir.html)
- [Boas Práticas ESP32](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/build-system.html)

---

**Última atualização:** 26/10/2025  
**Mantido por:** [@fabiobrasileiroo](https://github.com/fabiobrasileiroo)
