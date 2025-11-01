# 🔌 Hardware - Conexões e Esquemas

## 📦 Lista de Componentes

### Módulo 1 - Sensor de Distância

| Componente     | Quantidade | Especificação        |
| -------------- | ---------- | -------------------- |
| ESP32 DevKit   | 1          | Qualquer modelo      |
| Sensor HC-SR04 | 1          | Ultrassônico 2-400cm |
| Jumpers        | 4          | Macho-Macho          |

### ESP32-PAI - Mestre

| Componente   | Quantidade | Especificação      |
| ------------ | ---------- | ------------------ |
| ESP32 DevKit | 1          | Qualquer modelo    |
| Cabo USB     | 1          | Micro-USB ou USB-C |

### Módulo 3 - Motor de Vibração

| Componente           | Quantidade | Especificação               |
| -------------------- | ---------- | --------------------------- |
| ESP32 DevKit         | 1          | Qualquer modelo             |
| Motor Vibracall 1027 | 1          | Motor de celular            |
| Transistor NPN       | 1          | 2N2222 ou BC547             |
| Resistor             | 1          | 1kΩ (marrom-preto-vermelho) |
| Jumpers              | 5          | Macho-Macho                 |

## 🔌 Conexões

### Módulo 1 - Sensor HC-SR04

```
HC-SR04          ESP32
--------         -----
VCC      →       5V
GND      →       GND
TRIG     →       GPIO 33
ECHO     →       GPIO 25
```

**⚠️ Importante:** O HC-SR04 precisa de **5V** no VCC!

### ESP32-PAI - Mestre

```
ESP32-PAI
---------
Apenas USB conectado
(não precisa de hardware adicional)
```

### Módulo 3 - Motor de Vibração

```
Motor Vibracall 1027 → Transistor → ESP32
```

#### Esquema Detalhado:

```
                 +3.3V
                   │
                   │
                 [Motor]
                   │
                   ├─────┐ (Coletor)
                   │     │
                   │   [Transistor]
                   │     │
GPIO 4 ─[1kΩ]─────┴─────┤ (Base)
                         │
                       (Emissor)
                         │
                        GND
```

#### Conexões passo a passo:

1. **Motor (+)** → **VCC 3.3V** do ESP32
2. **Motor (-)** → **Coletor** do transistor
3. **GPIO 4** → **Resistor 1kΩ** → **Base** do transistor
4. **Emissor** do transistor → **GND**

**⚠️ NUNCA conecte o motor diretamente no GPIO!** O ESP32 não tem corrente suficiente.

## 📐 Diagrama Completo do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────────┐                  ┌──────────────┐         │
│  │   Módulo 1   │                  │  ESP32-PAI   │         │
│  │              │                  │   (Mestre)   │         │
│  │   ESP32      │───ESP-NOW───────▶│   ESP32      │         │
│  │     +        │   (sem fio)      │              │         │
│  │  HC-SR04     │                  └──────┬───────┘         │
│  │              │                         │                 │
│  └──────────────┘                         │                 │
│                                            │ ESP-NOW         │
│                                            │ (sem fio)       │
│                                            ▼                 │
│                                  ┌──────────────┐           │
│                                  │   Módulo 3   │           │
│                                  │              │           │
│                                  │   ESP32      │           │
│                                  │     +        │           │
│                                  │  Motor 1027  │           │
│                                  │              │           │
│                                  └──────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testes de Hardware

### Testar Sensor HC-SR04

```cpp
// Upload este código no Módulo 1 para testar o sensor
void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  int distance = (duration / 2) / 29.1;

  Serial.print("Distância: ");
  Serial.print(distance);
  Serial.println(" cm");
  delay(500);
}
```

### Testar Motor de Vibração

```cpp
// Upload este código no Módulo 3 para testar o motor
void loop() {
  digitalWrite(MOTOR_PIN, HIGH);
  delay(500);
  digitalWrite(MOTOR_PIN, LOW);
  delay(500);
}
```

## ⚡ Alimentação

### Opções de Alimentação

| Módulo    | Via USB     | Via Bateria  | Consumo Médio     |
| --------- | ----------- | ------------ | ----------------- |
| Módulo 1  | ✅ 5V 500mA | 🔋 3.7V LiPo | ~80mA             |
| ESP32-PAI | ✅ 5V 500mA | 🔋 3.7V LiPo | ~70mA             |
| Módulo 3  | ✅ 5V 500mA | 🔋 3.7V LiPo | ~100mA (vibrando) |

**Recomendação:** Use USB durante desenvolvimento e bateria LiPo 3.7V 1000mAh para uso portátil.

## 🔧 Dicas de Montagem

### ✅ Boas Práticas

1. **Solde os pinos do ESP32** para conexões mais firmes
2. **Use fios curtos** para reduzir interferência
3. **Teste cada módulo individualmente** antes de integrar
4. **Use protoboard** durante desenvolvimento
5. **PCB customizada** para versão final

### ❌ Erros Comuns

| Problema         | Causa          | Solução                   |
| ---------------- | -------------- | ------------------------- |
| Sensor não lê    | VCC em 3.3V    | Use 5V no VCC             |
| Motor não vibra  | Sem transistor | Adicione transistor       |
| ESP32 reseta     | Sobrecarga     | Use transistor para motor |
| Leituras erradas | Fios longos    | Use fios < 20cm           |

## 📏 Dimensões e Montagem

### Sugestão de Case

```
┌─────────────────────────────────┐
│  Módulo 1 (Sensor)              │
│  ┌──────┐                       │
│  │ESP32 │  ┌──────────┐         │
│  └──────┘  │ HC-SR04  │         │
│            └──────────┘         │
│  Dimensões: 8cm x 6cm x 3cm     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Módulo 3 (Motor)               │
│  ┌──────┐                       │
│  │ESP32 │  [Motor]              │
│  └──────┘  (Transistor interno) │
│                                  │
│  Dimensões: 6cm x 4cm x 2cm     │
└─────────────────────────────────┘
```

## 🛒 Lista de Compras

### Onde Comprar (Brasil)

| Item              | Loja                   | Preço Aprox. |
| ----------------- | ---------------------- | ------------ |
| ESP32 DevKit      | Eletrogate, FilipeFlop | R$ 35-45     |
| HC-SR04           | Eletrogate, FilipeFlop | R$ 10-15     |
| Motor 1027        | MercadoLivre           | R$ 5-10      |
| Transistor 2N2222 | Eletrogate             | R$ 0,50      |
| Resistor 1kΩ      | Eletrogate             | R$ 0,10      |

**Total estimado:** R$ 150-200 (para 3 módulos completos)

## 📞 Suporte

Problemas com hardware? Veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**Última atualização:** 26/10/2025
