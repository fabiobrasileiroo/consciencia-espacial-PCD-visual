import { IconSymbol } from '@/components/ui/icon-symbol';
import { hapticsService, storageService } from '@/my-expo-app/services/service-provider';
import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [volume, setVolume] = useState(0.7);
  const [deviceTime] = useState('2h 30min');
  const [battery] = useState(100);
  const [temperature] = useState(32);
  const [usageTime] = useState(5);
  const [alerts] = useState(3);

  useEffect(() => {
    loadVolume();
  }, []);

  const loadVolume = async () => {
    try {
      const savedVolume = await storageService.get('volume');
      if (savedVolume) {
        setVolume(parseFloat(savedVolume));
      }
    } catch (error) {
      console.error('Erro ao carregar volume:', error);
    }
  };

  const saveVolume = async (value: number) => {
    try {
      await storageService.set('volume', value.toString());
      await hapticsService.impact('light');
    } catch (error) {
      console.error('Erro ao salvar volume:', error);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handleVolumeComplete = (value: number) => {
    saveVolume(value);
  };

  const handleChangeMode = async () => {
    await hapticsService.impact('light');
  };

  const handleConnectBluetooth = async () => {
    await hapticsService.impact('light');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text className="text-5xl font-bold text-white text-center mb-8" style={{ fontFamily: 'System' }}>
          Lumi
        </Text>

        {/* Dispositivo Status */}
        <View className="bg-[#2c3142] rounded-3xl p-5 mb-5">
          <View className="flex-row items-center gap-4 mb-4">
            <IconSymbol name="eyeglasses" size={48} color="#fff" />
            <View className="flex-1">
              <Text className="text-xl font-semibold text-white">Dispositivo ligado!</Text>
              <Text className="text-base text-gray-400 mt-1">{deviceTime}</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <IconSymbol name="battery.100" size={20} color="#fff" />
              <Text className="text-white font-semibold">{battery}%</Text>
            </View>
            <View className="bg-[#4CAF50] px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">Conectado</Text>
            </View>
          </View>
        </View>

        {/* Histórico */}
        <View className="bg-[#2c3142] rounded-3xl p-5 mb-5">
          <Text className="text-xl font-semibold text-white mb-4">Histórico</Text>

          <View className="flex-row justify-around">
            <View className="items-center">
              <IconSymbol name="thermometer" size={24} color="#fff" />
              <Text className="text-white font-semibold mt-2">{temperature}°C</Text>
            </View>
            <View className="items-center">
              <IconSymbol name="clock" size={24} color="#fff" />
              <Text className="text-white font-semibold mt-2">{usageTime}h</Text>
            </View>
            <View className="items-center">
              <IconSymbol name="exclamationmark.triangle" size={24} color="#fff" />
              <Text className="text-white font-semibold mt-2">{alerts} avisos</Text>
            </View>
          </View>
        </View>

        {/* Testar som */}
        <View className="bg-[#2c3142] rounded-3xl p-5 mb-5">
          <Text className="text-xl font-semibold text-white mb-4">Testar som</Text>

          <View className="flex-row items-center gap-3">
            <IconSymbol name="speaker.wave.2.fill" size={24} color="#4CAF50" />
            <Slider
              style={{ flex: 1, height: 40 }}
              value={volume}
              onValueChange={handleVolumeChange}
              onSlidingComplete={handleVolumeComplete}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#555"
              thumbTintColor="#4CAF50"
            />
          </View>
        </View>

        {/* Botões de Ação */}
        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity
            className="flex-1 bg-[#4a5266] py-4 rounded-xl flex-row items-center justify-center gap-2"
            onPress={handleChangeMode}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={20} color="#fff" />
            <Text className="text-white text-base font-semibold">Mudar modo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-[#4a5266] py-4 rounded-xl flex-row items-center justify-center gap-2"
            onPress={handleConnectBluetooth}
            activeOpacity={0.7}
          >
            <IconSymbol name="antenna.radiowaves.left.and.right" size={20} color="#fff" />
            <Text className="text-white text-base font-semibold">Conectar Bluetooth</Text>
          </TouchableOpacity>
        </View>

        {/* Transcrição de objetos */}
        <View className="bg-[#2c3142] rounded-3xl p-5">
          <Text className="text-xl font-semibold text-white mb-4">
            Transcrição de objetos
          </Text>

          <Text className="text-base text-gray-300 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
