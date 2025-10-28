import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { TTSService } from '../services/tts-service';
import { HapticsService } from '../services/haptics-service';
import { BluetoothService } from '../services/bluetooth-service';

interface HistoryItem {
  icon: string;
  value: string;
  label: string;
}

type RootStackParamList = {
  Home: undefined;
  Configuracoes: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [deviceStatus, setDeviceStatus] = useState({
    connected: true,
    timeOn: '2h 30min',
    battery: 100,
  });

  const [volume, setVolume] = useState(75);
  const [transcription, setTranscription] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure'
  );

  const [history] = useState<HistoryItem[]>([
    { icon: '🌡️', value: '32°C', label: 'Temperatura' },
    { icon: '⚡', value: '5h', label: 'Tempo de uso' },
    { icon: '⚠️', value: '3 avisos', label: 'Notificações' },
  ]);

  const ttsService = new TTSService();
  const hapticsService = new HapticsService();
  const bluetoothService = new BluetoothService();

  useEffect(() => {
    announceScreen();
  }, []);

  const announceScreen = async () => {
    const status = deviceStatus.connected ? 'conectado' : 'desconectado';
    await ttsService.speak(
      `Tela inicial. Dispositivo ${status}. Bateria em ${deviceStatus.battery} por cento. Tempo ligado: ${deviceStatus.timeOn}`
    );
  };

  const handleDeviceStatusPress = async () => {
    await hapticsService.impact('medium');
    const status = deviceStatus.connected ? 'conectado' : 'desconectado';
    await ttsService.speak(
      `Dispositivo ${status}. Tempo ligado: ${deviceStatus.timeOn}. Bateria: ${deviceStatus.battery} por cento`
    );
  };

  const handleHistoryItemPress = async (item: HistoryItem) => {
    await hapticsService.impact('light');
    await ttsService.speak(`${item.label}: ${item.value}`);
  };

  const handleVolumeChange = async (direction: 'up' | 'down') => {
    await hapticsService.impact('light');
    
    if (direction === 'up' && volume < 100) {
      const newVolume = Math.min(100, volume + 10);
      setVolume(newVolume);
      await ttsService.speak(`Volume ${newVolume} por cento`);
    } else if (direction === 'down' && volume > 0) {
      const newVolume = Math.max(0, volume - 10);
      setVolume(newVolume);
      await ttsService.speak(`Volume ${newVolume} por cento`);
    }
  };

  const handleTestSound = async () => {
    await hapticsService.impact('medium');
    await ttsService.speak('Testando som. Este é um teste de áudio para verificar o volume atual do sistema');
  };

  const handleModeChange = async () => {
    await hapticsService.vibratePattern([200, 100, 200]);
    await ttsService.speak('Mudando modo de operação do dispositivo');
  };

  const handleBluetoothConnect = async () => {
    await hapticsService.impact('heavy');
    await ttsService.speak('Abrindo configurações de Bluetooth');
  };

  const handleTranscriptionPress = async () => {
    await hapticsService.impact('light');
    await ttsService.speak(`Transcrição de objetos: ${transcription}`);
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
            <Image
              source={require('../assets/logo.png')}
              className="w-12 h-12"
              resizeMode="contain"
            />
          </Text>
        </View>

        {/* Status do Dispositivo */}
        <TouchableOpacity
          onPress={handleDeviceStatusPress}
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Status do dispositivo. ${deviceStatus.connected ? 'Conectado' : 'Desconectado'}. Tempo ligado: ${deviceStatus.timeOn}. Bateria: ${deviceStatus.battery} por cento`}
          accessibilityHint="Toque duas vezes para ouvir os detalhes do status"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-[#363a54] rounded-2xl items-center justify-center mr-4">
                <Text className="text-white text-2xl">👓</Text>
              </View>
              <View>
                <Text className="text-white text-lg font-semibold mb-1">
                  Dispositivo ligado!
                </Text>
                <Text className="text-gray-400 text-sm">
                  {deviceStatus.timeOn}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-white text-base mr-2">🔋</Text>
              <Text className="text-white text-base">{deviceStatus.battery}%</Text>
            </View>
            <View 
              className="px-4 py-2 rounded-full bg-green-500/20"
              accessible={false}
            >
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-green-500 text-sm font-medium">
                  Conectado
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Histórico */}
        <View 
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel="Seção de histórico com informações recentes"
        >
          <Text className="text-white text-xl font-semibold mb-4">
            Histórico
          </Text>

          <View className="flex-row justify-between">
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleHistoryItemPress(item)}
                className="bg-[#363a54] rounded-2xl p-4 flex-1 mx-1"
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}: ${item.value}`}
                accessibilityHint="Toque duas vezes para ouvir esta informação"
              >
                <Text className="text-2xl mb-2 text-center">{item.icon}</Text>
                <Text className="text-white text-lg font-semibold text-center mb-1">
                  {item.value}
                </Text>
                <Text className="text-gray-400 text-xs text-center">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Testar Som */}
        <View 
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel={`Controle de volume e teste de som. Volume atual: ${volume} por cento`}
        >
          <Text className="text-white text-xl font-semibold mb-4">
            Testar som
          </Text>

          <View className="flex-row items-center mb-4">
            <Text className="text-white text-2xl mr-3">🔊</Text>
            <View className="flex-1 h-2 bg-[#363a54] rounded-full overflow-hidden">
              <View 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${volume}%` }}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => handleVolumeChange('down')}
              className="bg-[#363a54] rounded-xl px-4 py-3 flex-1 mr-2"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Diminuir volume"
              accessibilityHint={`Volume atual ${volume} por cento`}
            >
              <Text className="text-white text-center text-base">▼</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTestSound}
              className="bg-[#4a4e6e] rounded-xl px-4 py-3 flex-[2] mx-2"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Testar som"
              accessibilityHint="Toque duas vezes para reproduzir um som de teste"
            >
              <Text className="text-white text-center text-base font-semibold">
                ▶️  Testar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleVolumeChange('up')}
              className="bg-[#363a54] rounded-xl px-4 py-3 flex-1 ml-2"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Aumentar volume"
              accessibilityHint={`Volume atual ${volume} por cento`}
            >
              <Text className="text-white text-center text-base">▲</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botões de Ação */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={handleModeChange}
            className="bg-[#4a4e6e] rounded-2xl px-6 py-4 flex-1 mr-3"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Mudar modo"
            accessibilityHint="Toque duas vezes para alterar o modo de operação do dispositivo"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-xl mr-2">🔄</Text>
              <Text className="text-white text-base font-semibold">
                Mudar modo
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBluetoothConnect}
            className="bg-[#4a4e6e] rounded-2xl px-6 py-4 flex-1 ml-3"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Conectar Bluetooth"
            accessibilityHint="Toque duas vezes para abrir configurações de Bluetooth"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-xl mr-2">📡</Text>
              <Text className="text-white text-base font-semibold">
                Conectar{'\n'}Bluetooth
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Transcrição de Objetos */}
        <TouchableOpacity
          onPress={handleTranscriptionPress}
          className="bg-[#2a2d44] rounded-3xl p-6 mb-6"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Transcrição de objetos detectados"
          accessibilityHint="Toque duas vezes para ouvir a transcrição completa"
        >
          <Text className="text-white text-xl font-semibold mb-4">
            Transcrição de objetos
          </Text>
          <Text 
            className="text-gray-300 text-base leading-6"
            accessible={false}
          >
            {transcription}
          </Text>
        </TouchableOpacity>

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
          className="flex-1 items-center justify-center py-4 border-t-2 border-white"
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Home"
          accessibilityState={{ selected: true }}
          accessibilityHint="Você está na tela inicial"
        >
          <Text className="text-white text-base font-medium">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabPress('Configurações')}
          className="flex-1 items-center justify-center py-4"
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Configurações"
          accessibilityHint="Toque duas vezes para ir para configurações"
        >
          <Text className="text-gray-400 text-base font-medium">Configurações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
