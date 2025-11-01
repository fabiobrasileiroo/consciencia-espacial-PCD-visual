# 📱 Lumi - Aplicativo de Assistência Visual para PCD

## 🎯 Visão Geral

Aplicativo desenvolvido com **acessibilidade total** para pessoas com deficiência visual (PCD), utilizando:
- ✅ **Text-to-Speech (TTS)** em todos os elementos
- ✅ **Feedback Háptico** para interações
- ✅ **Navegação por Screen Readers**
- ✅ **Tailwind CSS (NativeWind)** para estilização
- ✅ **React Navigation** para navegação entre telas

## 📁 Estrutura de Arquivos Criados

```
screens/
├── HomeScreen.tsx          # Tela principal com status e controles
└── ConfiguracoesScreen.tsx # Tela de configurações e dispositivos

services/
├── tts-service.ts          # Serviço de Text-to-Speech
├── haptics-service.ts      # Serviço de Feedback Háptico
└── bluetooth-service.ts    # Serviço de Bluetooth
```

## 🎨 Telas Criadas

### 1️⃣ HomeScreen (Tela Principal)
**Recursos de Acessibilidade:**
- 🔊 Anuncia automaticamente o status ao carregar
- 📱 Feedback háptico em todas as interações
- 🎯 Labels descritivos em todos os elementos
- 🗣️ TTS lê informações completas ao tocar

**Funcionalidades:**
- ✅ Status do dispositivo (conectado/desconectado, bateria, tempo)
- ✅ Histórico com temperatura, tempo de uso e avisos
- ✅ Controle de volume com teste de som
- ✅ Botões de mudança de modo e conexão Bluetooth
- ✅ Transcrição de objetos detectados

**Propriedades de Acessibilidade Implementadas:**
```tsx
accessible={true}
accessibilityRole="button" // ou "header", "adjustable", "tab"
accessibilityLabel="Descrição clara do elemento"
accessibilityHint="O que acontece ao interagir"
accessibilityState={{ selected: true }} // Para tabs
```

### 2️⃣ ConfiguracoesScreen (Tela de Configurações)
**Recursos de Acessibilidade:**
- 🔊 Anuncia lista de dispositivos e status
- 📱 Vibração diferente para cada tipo de interação
- 🎯 Informações completas via TTS
- 🗣️ Feedback verbal para ajustes de volume

**Funcionalidades:**
- ✅ Lista de dispositivos conectados (SmartGlasses, SmartBracelet, Airpods)
- ✅ Controle de volume com botões + e -
- ✅ Barra visual de volume
- ✅ Menu de ajuda e FAQ
- ✅ Informações sobre o aplicativo

## 🎤 Text-to-Speech (TTS)

### Como Funciona
Cada interação do usuário gera um feedback verbal:

```typescript
// Exemplo ao pressionar status do dispositivo
await ttsService.speak(
  `Dispositivo conectado. Tempo ligado: 2h 30min. Bateria: 100 por cento`
);
```

### Momentos de Uso do TTS:
1. **Ao carregar a tela**: Anuncia onde o usuário está
2. **Ao tocar em elementos**: Lê informações detalhadas
3. **Ao ajustar controles**: Confirma o valor atual
4. **Ao navegar**: Informa a mudança de tela

## 📳 Feedback Háptico

### Intensidades Implementadas:
- `light`: Toques leves (ajustes de volume, histórico)
- `medium`: Toques médios (dispositivos, botões principais)
- `heavy`: Toques fortes (conexão Bluetooth)
- `pattern`: Padrões personalizados (mudança de modo)

```typescript
// Exemplos de uso
await hapticsService.impact('light');        // Toque leve
await hapticsService.impact('medium');       // Toque médio
await hapticsService.vibratePattern([200, 100, 200]); // Padrão customizado
```

## 🎨 Estilização com Tailwind

### Cores do Tema:
- `#1a1d2e` - Background principal
- `#2a2d44` - Cards e seções
- `#363a54` - Elementos secundários
- `#4a4e6e` - Botões de ação
- `green-500` - Indicadores de status positivo

### Classes Principais:
```tsx
className="flex-1 bg-[#1a1d2e]"              // Container principal
className="bg-[#2a2d44] rounded-3xl p-6"     // Cards
className="text-white text-xl font-semibold" // Títulos
className="flex-row items-center"             // Layouts horizontais
```

## 🚀 Como Usar

### 1. Iniciar o Aplicativo
```bash
cd /home/fabiobrasileiro/estudos/consciencia-espacial-PCD-visual/app/my-expo-app
pnpm start
```

### 2. Testar em Dispositivo
```bash
# iOS
pnpm ios

# Android
pnpm android
```

### 3. Ativar Screen Reader
**iOS (VoiceOver):**
- Configurações > Acessibilidade > VoiceOver > Ativar

**Android (TalkBack):**
- Configurações > Acessibilidade > TalkBack > Ativar

## 🎯 Navegação Acessível

### Gestos com Screen Reader:
- **Deslizar direita**: Próximo elemento
- **Deslizar esquerda**: Elemento anterior
- **Toque duplo**: Ativar elemento
- **Três dedos para baixo**: Ler tudo na tela

### Navegação entre Telas:
```typescript
// Ambas as telas possuem menu inferior
<TouchableOpacity
  onPress={() => handleTabPress('Home')}
  accessible={true}
  accessibilityRole="tab"
  accessibilityState={{ selected: true }}
>
```

## 🔧 Personalização

### Adicionar Nova Funcionalidade com TTS:
```typescript
const handleNewFeature = async () => {
  // 1. Feedback háptico
  await hapticsService.impact('medium');
  
  // 2. Feedback verbal
  await ttsService.speak('Descrição da ação');
  
  // 3. Executar ação
  // ... seu código aqui
};
```

### Adicionar Novo Elemento Acessível:
```tsx
<TouchableOpacity
  onPress={handleAction}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Nome claro do elemento"
  accessibilityHint="O que acontece ao tocar"
>
  <Text>Conteúdo</Text>
</TouchableOpacity>
```

## 📋 Checklist de Acessibilidade

- ✅ Todos os elementos interativos têm `accessible={true}`
- ✅ Todos os botões têm `accessibilityRole="button"`
- ✅ Todos os elementos têm `accessibilityLabel` descritivo
- ✅ Elementos complexos têm `accessibilityHint`
- ✅ Feedback háptico em todas as interações
- ✅ TTS fornece contexto completo
- ✅ Navegação por teclado/gestos funciona
- ✅ Contraste de cores adequado (WCAG AAA)
- ✅ Textos grandes e legíveis
- ✅ Ícones complementam, não substituem texto

## 🎓 Recursos de Aprendizado

### Propriedades de Acessibilidade React Native:
- `accessible`: Marca o elemento como acessível
- `accessibilityRole`: Tipo do elemento (button, header, etc)
- `accessibilityLabel`: Texto lido pelo screen reader
- `accessibilityHint`: Dica de o que acontece ao interagir
- `accessibilityState`: Estado do elemento (selected, disabled)
- `accessibilityValue`: Valor de elementos ajustáveis

### Boas Práticas:
1. **Sempre forneça contexto**: "Volume 75%" em vez de só "75"
2. **Use verbos de ação**: "Aumentar volume" em vez de "Mais"
3. **Confirme ações**: Feedback verbal após cada interação
4. **Seja consistente**: Mesmo padrão de feedback em toda app
5. **Teste com screen reader**: Sempre teste com VoiceOver/TalkBack

## 🐛 Troubleshooting

### TTS não funciona:
- Verifique permissões do dispositivo
- Teste em dispositivo real (não funciona bem em simuladores)
- Verifique se o serviço TTS está ativo

### Haptics não vibra:
- `expo-haptics` requer dispositivo físico
- Verifique permissões de vibração
- Alguns simuladores não suportam haptics

### Navegação não funciona:
- Verifique se `@react-navigation` está instalado
- Certifique-se de que `NavigationContainer` envolve as rotas
- Verifique console para erros de navegação

## 🎉 Resultado

Duas telas completamente acessíveis para pessoas com deficiência visual, seguindo as melhores práticas de acessibilidade mobile:

1. ✅ **HomeScreen**: Status, controles e informações principais
2. ✅ **ConfiguracoesScreen**: Gerenciamento de dispositivos e configurações
3. ✅ **TTS integrado**: Feedback verbal em todas as interações
4. ✅ **Haptics**: Feedback tátil diferenciado
5. ✅ **Navegação acessível**: Tabs com indicação de estado
6. ✅ **Design inclusivo**: Cores, contrastes e tamanhos apropriados

---

**Desenvolvido com ❤️ para acessibilidade e inclusão**
