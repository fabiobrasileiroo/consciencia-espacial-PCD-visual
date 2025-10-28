import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { TTSService } from '../services/tts-service';
import { HapticsService } from '../services/haptics-service';

interface Device {
  id: string;
  name: string;
  type: string;
  connected: boolean;
}

type RootStackParamList = {
  Home: undefined;
  Configuracoes: undefined;
};

export default function ConfiguracoesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [volume, setVolume] = useState(75);
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'LUMI - SmartGlasses v1.0', type: 'glasses', connected: true },
    { id: '2', name: 'LUMI - SmartBracelet v1.0', type: 'bracelet', connected: false },
    { id: '3', name: 'Apple - Airpods v1.0', type: 'airpods', connected: true },
  ]);

  const ttsService = new TTSService();
  const hapticsService = new HapticsService();

  useEffect(() => {
    // Anuncia a tela quando carrega
    announceScreen();
  }, []);

  const announceScreen = async () => {
    await ttsService.speak('Tela de Configurações. Dispositivos conectados, controle de volume e informações de suporte disponíveis.');
  };

  const handleDevicePress = async (device: Device) => {
    await hapticsService.impact('medium');
    const status = device.connected ? 'conectado' : 'desligado';
    await ttsService.speak(`Dispositivo ${device.name}, ${status}`);
  };

  const handleVolumeChange = async (direction: 'up' | 'down') => {
    await hapticsService.impact('light');
    
    if (direction === 'up' && volume < 100) {
      const newVolume = Math.min(100, volume + 10);
      setVolume(newVolume);
      await ttsService.speak(`Volume aumentado para ${newVolume} por cento`);
    } else if (direction === 'down' && volume > 0) {
      const newVolume = Math.max(0, volume - 10);
      setVolume(newVolume);
      await ttsService.speak(`Volume diminuído para ${newVolume} por cento`);
    }
  };

  const handleMenuPress = async (menuName: string) => {
    await hapticsService.impact('medium');
    await ttsService.speak(`Abrindo ${menuName}`);
  };

  const handleTabPress = async (tabName: 'Home' | 'Configuracoes') => {
    await hapticsService.impact('light');
    await ttsService.speak(`Navegando para ${tabName === 'Home' ? 'início' : 'configurações'}`);
    navigation.navigate(tabName);
  };

  return (
    <View className="flex-1 bg-[#1a1d2e]">
      <ScrollView className="flex-1 px-4 pt-12">
        {/* Header */}
        <View 
          className="items-center mb-8"
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Lumi - Aplicativo de assistência visual"
        >
          <Text className="text-white text-4xl font-bold tracking-wider">
            Lumi
          </Text>
        </View>

        {/* Dispositivos Conectados */}
        <View 
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel={`Seção de dispositivos conectados. ${devices.filter(d => d.connected).length} de ${devices.length} dispositivos conectados`}
        >
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-[#363a54] rounded-xl items-center justify-center mr-3">
              <Text className="text-white text-xl">⚙️</Text>
            </View>
            <Text className="text-white text-xl font-semibold">
              Dispositivos conectados
            </Text>
          </View>

          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              onPress={() => handleDevicePress(device)}
              className="flex-row items-center justify-between py-3 border-b border-[#363a54] last:border-b-0"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Dispositivo ${device.name}, ${device.connected ? 'conectado' : 'desligado'}`}
              accessibilityHint="Toque duas vezes para ouvir informações do dispositivo"
            >
              <View className="flex-row items-center flex-1">
                <Text className="text-gray-400 mr-3">-</Text>
                <Text className="text-white text-base flex-1">{device.name}</Text>
              </View>
              <View 
                className={`px-3 py-1 rounded-full ${device.connected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}
                accessible={false}
              >
                <View className="flex-row items-center">
                  <View 
                    className={`w-2 h-2 rounded-full mr-2 ${device.connected ? 'bg-green-500' : 'bg-gray-500'}`}
                  />
                  <Text className={`text-sm font-medium ${device.connected ? 'text-green-500' : 'text-gray-500'}`}>
                    {device.connected ? 'Conectado' : 'Desligado'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Controle de Volume */}
        <View 
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={`Controle de volume. Volume atual: ${volume} por cento`}
          accessibilityValue={{ min: 0, max: 100, now: volume }}
        >
          <Text className="text-white text-xl font-semibold text-center mb-6">
            Volume
          </Text>

          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={() => handleVolumeChange('up')}
              className="bg-[#4a4e6e] rounded-2xl px-6 py-4 flex-1 mr-3"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Aumentar volume"
              accessibilityHint={`Volume atual ${volume} por cento. Toque duas vezes para aumentar`}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-white text-lg mr-2">▲</Text>
                <Text className="text-white text-base font-semibold">Aumentar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleVolumeChange('down')}
              className="bg-[#4a4e6e] rounded-2xl px-6 py-4 flex-1 ml-3"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Abaixar volume"
              accessibilityHint={`Volume atual ${volume} por cento. Toque duas vezes para diminuir`}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-white text-lg mr-2">▼</Text>
                <Text className="text-white text-base font-semibold">Abaixar</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Barra de Volume */}
          <View 
            className="flex-row items-center"
            accessible={false}
          >
            <Text className="text-white text-2xl mr-3">🔊</Text>
            <View className="flex-1 h-2 bg-[#363a54] rounded-full overflow-hidden">
              <View 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${volume}%` }}
              />
            </View>
          </View>
        </View>

        {/* Suporte e Informações */}
        <View 
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel="Seção de suporte e informações"
        >
          <Text className="text-white text-xl font-semibold mb-4">
            Suporte e Informações
          </Text>

          <TouchableOpacity
            onPress={() => handleMenuPress('Ajuda e FAQ')}
            className="py-4 border-b border-[#363a54]"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ajuda e FAQ"
            accessibilityHint="Toque duas vezes para abrir perguntas frequentes"
          >
            <Text className="text-white text-lg">Ajuda e FAQ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleMenuPress('Sobre o Aplicativo')}
            className="py-4"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Sobre o Aplicativo"
            accessibilityHint="Toque duas vezes para ver informações sobre o aplicativo"
          >
            <Text className="text-white text-lg">Sobre o Aplicativo</Text>
          </TouchableOpacity>
        </View>

        {/* Espaço para o menu inferior */}
        <View className="h-24" />
      </ScrollView>

      {/* Menu de Navegação Inferior */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-[#2a2d44] border-t border-[#363a54] flex-row"
        accessible={true}
        accessibilityRole="tablist"
        accessibilityLabel="Menu de navegação"
      >
        <TouchableOpacity
          onPress={() => handleTabPress('Home')}
          className="flex-1 items-center justify-center py-4"
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Home"
          accessibilityHint="Toque duas vezes para ir para a tela inicial"
        >
          <Text className="text-gray-400 text-base font-medium">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabPress('Configurações')}
          className="flex-1 items-center justify-center py-4 border-t-2 border-white"
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Configurações"
          accessibilityState={{ selected: true }}
          accessibilityHint="Você está na tela de configurações"
        >
          <Text className="text-white text-base font-medium">Configurações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
