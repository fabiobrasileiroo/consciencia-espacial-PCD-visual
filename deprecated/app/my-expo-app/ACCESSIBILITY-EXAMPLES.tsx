// Exemplo de uso dos componentes de acessibilidade

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TTSService } from './services/tts-service';
import { HapticsService } from './services/haptics-service';

// ========================================
// EXEMPLO 1: Botão com Acessibilidade Total
// ========================================
export const AccessibleButton = () => {
  const ttsService = new TTSService();
  const hapticsService = new HapticsService();

  const handlePress = async () => {
    // 1. Feedback tátil
    await hapticsService.impact('medium');
    
    // 2. Feedback verbal
    await ttsService.speak('Conectando ao dispositivo Bluetooth');
    
    // 3. Ação
    console.log('Conectando...');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      // Propriedades de acessibilidade
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Conectar Bluetooth"
      accessibilityHint="Toque duas vezes para iniciar conexão Bluetooth"
      // Estilo Tailwind
      className="bg-blue-600 px-6 py-4 rounded-xl"
    >
      <Text className="text-white text-lg font-semibold text-center">
        📡 Conectar Bluetooth
      </Text>
    </TouchableOpacity>
  );
};

// ========================================
// EXEMPLO 2: Controle de Volume Acessível
// ========================================
export const VolumeControl = () => {
  const [volume, setVolume] = React.useState(50);
  const ttsService = new TTSService();
  const hapticsService = new HapticsService();

  const adjustVolume = async (delta: number) => {
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    setVolume(newVolume);
    
    // Feedback
    await hapticsService.impact('light');
    await ttsService.speak(`Volume ${newVolume} por cento`);
  };

  return (
    <View
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={`Controle de volume`}
      accessibilityValue={{ min: 0, max: 100, now: volume, text: `${volume}%` }}
      className="bg-gray-800 p-4 rounded-2xl"
    >
      <Text className="text-white text-lg mb-4">Volume: {volume}%</Text>
      
      <View className="flex-row gap-4">
        <TouchableOpacity
          onPress={() => adjustVolume(-10)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Diminuir volume"
          className="bg-gray-700 px-4 py-2 rounded-lg flex-1"
        >
          <Text className="text-white text-center">➖ Diminuir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => adjustVolume(+10)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aumentar volume"
          className="bg-gray-700 px-4 py-2 rounded-lg flex-1"
        >
          <Text className="text-white text-center">➕ Aumentar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ========================================
// EXEMPLO 3: Card de Status com TTS
// ========================================
export const StatusCard = () => {
  const ttsService = new TTSService();
  const hapticsService = new HapticsService();

  const deviceInfo = {
    name: 'LUMI SmartGlasses',
    battery: 85,
    connected: true,
    timeOn: '3h 15min'
  };

  const handlePress = async () => {
    await hapticsService.impact('medium');
    
    const statusText = `${deviceInfo.name}. ${
      deviceInfo.connected ? 'Conectado' : 'Desconectado'
    }. Bateria: ${deviceInfo.battery} por cento. Tempo ligado: ${deviceInfo.timeOn}`;
    
    await ttsService.speak(statusText);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Status do dispositivo ${deviceInfo.name}`}
      accessibilityHint="Toque duas vezes para ouvir informações completas"
      className="bg-gray-800 p-6 rounded-3xl"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Text className="text-white text-2xl mr-3">👓</Text>
          <View>
            <Text className="text-white text-lg font-semibold">
              {deviceInfo.name}
            </Text>
            <Text className="text-gray-400 text-sm">
              {deviceInfo.timeOn}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white mr-2">🔋</Text>
          <Text className="text-white">{deviceInfo.battery}%</Text>
        </View>
        
        {deviceInfo.connected && (
          <View className="bg-green-500/20 px-3 py-1 rounded-full">
            <Text className="text-green-500 font-medium">✓ Conectado</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ========================================
// EXEMPLO 4: Lista Acessível
// ========================================
export const AccessibleList = () => {
  const ttsService = new TTSService();
  const hapticsService = new HapticsService();

  const items = [
    { id: 1, name: 'SmartGlasses', status: 'Conectado' },
    { id: 2, name: 'SmartBracelet', status: 'Desligado' },
    { id: 3, name: 'Airpods', status: 'Conectado' },
  ];

  const handleItemPress = async (item: typeof items[0]) => {
    await hapticsService.impact('light');
    await ttsService.speak(`${item.name}, ${item.status}`);
  };

  return (
    <View
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel={`Lista de dispositivos. ${items.length} itens`}
      className="bg-gray-800 rounded-3xl p-4"
    >
      <Text className="text-white text-xl font-semibold mb-4">
        Dispositivos
      </Text>

      {items.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleItemPress(item)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.status}`}
          accessibilityHint="Toque duas vezes para ouvir detalhes"
          className="flex-row items-center justify-between py-3 border-b border-gray-700 last:border-b-0"
        >
          <Text className="text-white text-base">{item.name}</Text>
          <Text className={`text-sm ${
            item.status === 'Conectado' ? 'text-green-500' : 'text-gray-500'
          }`}>
            {item.status}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ========================================
// EXEMPLO 5: Navegação com Tabs Acessíveis
// ========================================
export const AccessibleTabs = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  const ttsService = new TTSService();
  const hapticsService = new HapticsService();

  const handleTabPress = async (tabName: string, label: string) => {
    setActiveTab(tabName);
    await hapticsService.impact('light');
    await ttsService.speak(`Navegando para ${label}`);
  };

  return (
    <View
      accessible={true}
      accessibilityRole="tablist"
      accessibilityLabel="Menu de navegação"
      className="bg-gray-800 flex-row border-t border-gray-700"
    >
      <TouchableOpacity
        onPress={() => handleTabPress('home', 'Home')}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Home"
        accessibilityState={{ selected: activeTab === 'home' }}
        className={`flex-1 py-4 ${
          activeTab === 'home' ? 'border-t-2 border-white' : ''
        }`}
      >
        <Text className={`text-center ${
          activeTab === 'home' ? 'text-white' : 'text-gray-500'
        }`}>
          🏠 Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleTabPress('settings', 'Configurações')}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel="Configurações"
        accessibilityState={{ selected: activeTab === 'settings' }}
        className={`flex-1 py-4 ${
          activeTab === 'settings' ? 'border-t-2 border-white' : ''
        }`}
      >
        <Text className={`text-center ${
          activeTab === 'settings' ? 'text-white' : 'text-gray-500'
        }`}>
          ⚙️ Configurações
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ========================================
// DICAS E BOAS PRÁTICAS
// ========================================

/*
✅ SEMPRE FAÇA:
1. Use accessible={true} em elementos interativos
2. Forneça accessibilityLabel descritivo
3. Adicione feedback háptico
4. Adicione feedback TTS
5. Use accessibilityRole apropriado
6. Teste com VoiceOver/TalkBack

❌ EVITE:
1. Labels genéricos como "Botão" ou "Item"
2. Hints muito longos (máximo 2 frases)
3. Feedback TTS muito frequente
4. Elementos muito pequenos (<44x44 pontos)
5. Apenas ícones sem texto
6. Contraste baixo de cores

📋 ROLES DISPONÍVEIS:
- button: Botões e ações
- header: Títulos e cabeçalhos
- link: Links e navegação
- text: Texto estático
- adjustable: Controles deslizantes
- image: Imagens
- tab: Abas de navegação
- list: Listas de itens

🎤 DICAS DE TTS:
- Seja conciso mas completo
- Use números em texto: "75 por cento" não "75%"
- Confirme ações: "Volume aumentado para..."
- Forneça contexto: "Dispositivo X, conectado"

📳 DICAS DE HAPTICS:
- light: Feedback leve e frequente
- medium: Ações padrão
- heavy: Ações importantes
- pattern: Eventos especiais

🎨 DICAS DE UI:
- Contraste mínimo: 4.5:1 (texto normal)
- Contraste mínimo: 3:1 (texto grande)
- Tamanho mínimo de toque: 44x44 pontos
- Espaçamento adequado entre elementos
- Fontes legíveis e tamanhos apropriados
*/
