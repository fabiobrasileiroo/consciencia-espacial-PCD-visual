import { IconSymbol } from '@/components/ui/icon-symbol';
import { hapticsService, storageService } from 'services/service-provider';
import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Device = {
  name: string;
  version: string;
  connected: boolean;
};

export default function SettingsScreen() {
  const [volume, setVolume] = useState(0.7);
  const [devices] = useState<Device[]>([
    { name: 'LUMI - SmartGlasses', version: 'v1.0', connected: true },
    { name: 'LUMI - SmartBracelet', version: 'v1.0', connected: false },
    { name: 'Apple - Airpods', version: 'v1.0', connected: true },
  ]);

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

  const increaseVolume = () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
    saveVolume(newVolume);
  };

  const decreaseVolume = () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
    saveVolume(newVolume);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handleVolumeComplete = (value: number) => {
    saveVolume(value);
  };

  const handleHelp = () => {
    Alert.alert('Ajuda e FAQ', 'Acesse nossa central de ajuda para mais informações sobre o aplicativo.');
  };

  const handleAbout = () => {
    Alert.alert('Sobre o Aplicativo', 'LUMI - Sistema de Consciência Espacial\nVersão 1.0.0\n\nDesenvolvido para auxiliar pessoas com deficiência visual.');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1a1d2e]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text className="text-5xl font-bold text-white text-center mb-8" style={{ fontFamily: 'System' }}>
          Lumi
        </Text>

        {/* Dispositivos Conectados */}
        <View className="bg-[#2c3142] rounded-3xl p-5 mb-5">
          <View className="flex-row items-center gap-3 mb-4">
            <IconSymbol name="cpu" size={32} color="#fff" />
            <Text className="text-xl font-semibold text-white">Dispositivos conectados</Text>
          </View>

          {devices.map((device, index) => (
            <View key={index} className="flex-row justify-between items-center my-2">
              <Text className="text-base text-white flex-1">
                - {device.name} {device.version}
              </Text>
              <View className={`px-3 py-1.5 rounded-xl ${device.connected ? 'bg-[#4CAF50]' : 'bg-[#666]'}`}>
                <Text className="text-sm font-semibold text-white">
                  {device.connected ? 'Conectado' : 'Desligado'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Volume */}
        <View className="bg-[#2c3142] rounded-3xl p-5 mb-5">
          <Text className="text-xl font-semibold text-white mb-5">Volume</Text>

          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 bg-[#4a5266] py-4 rounded-xl"
              onPress={increaseVolume}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.up" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold">Aumentar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 bg-[#4a5266] py-4 rounded-xl"
              onPress={decreaseVolume}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.down" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold">Abaixar</Text>
            </TouchableOpacity>
          </View>

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

        {/* Suporte e Informações */}
        <View className="bg-[#2c3142] rounded-3xl p-5">
          <Text className="text-xl font-semibold text-white mb-5">
            Suporte e Informações
          </Text>

          <TouchableOpacity
            className="bg-[#3a4156] py-5 px-5 rounded-xl mb-3"
            onPress={handleHelp}
            activeOpacity={0.7}
          >
            <Text className="text-lg font-semibold text-white text-center">
              Ajuda e FAQ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#3a4156] py-5 px-5 rounded-xl"
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <Text className="text-lg font-semibold text-white text-center">
              Sobre o Aplicativo
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
