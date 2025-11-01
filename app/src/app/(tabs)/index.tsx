import { IconSymbol } from '@/components/ui/icon-symbol';
import { Battery } from '@/components/ui/battery';
import { hapticsService, storageService } from 'services/service-provider';
import { Image } from 'react-native'
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/Card';

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
    <SafeAreaView className="flex-1 bg-[#141A2D]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{ uri: 'https://i.ibb.co/LXWXhCV7/Logo-5.png' }}
          className="w-40 h-40 mx-auto"
          resizeMode="contain"
        />

        <View className="flex gap-5">
          <Card>
            <CardHeader>
              <View className="flex-row items-center gap-3 mb-2">
                <View className="p-3 rounded-full">
                  {/* <IconSymbol name="eyeglasses" size={28} color="#fff" /> */}
                  <Image
                    source={{ uri: 'https://i.ibb.co/twQ1VvGY/glasses.png' }}
                    className="w-12 h-12 mx-auto"
                    resizeMode="contain"
                  />
                </View>
                <View className="flex-1">
                  <CardTitle>Dispositivo ligado</CardTitle>
                  <CardDescription>{deviceTime}</CardDescription>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row justify-between items-center">
                <View className="ml-4 flex-row items-center gap-3">
                  <Battery percent={battery} width={40} height={20} />
                  <Text className="text-white font-semibold text-base">{battery}%</Text>
                </View>
                <View className="bg-[#4CAF50] px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold">Conectado</Text>
                </View>
              </View>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <IconSymbol name="thermometer" size={28} color="#4CAF50" />
                  <Text className="text-white font-semibold mt-2">{temperature}°C</Text>
                </View>
                <View className="items-center">
                  <IconSymbol name="clock" size={28} color="#4CAF50" />
                  <Text className="text-white font-semibold mt-2">{usageTime}h</Text>
                </View>
                <View className="items-center">
                  <IconSymbol name="exclamationmark.triangle" size={28} color="#FFD54F" />
                  <Text className="text-white font-semibold mt-2">{alerts} avisos</Text>
                </View>
              </View>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Testar som</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className="flex-1 bg-[#404C72] py-4 rounded-xl flex-row items-center justify-center gap-2"
              onPress={handleChangeMode}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.triangle.2.circlepath" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold">Mudar modo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#404C72] py-4 rounded-xl flex-row items-center justify-center gap-2"
              onPress={handleConnectBluetooth}
              activeOpacity={0.7}
            >
              <IconSymbol name="antenna.radiowaves.left.and.right" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold">Conectar Bluetooth</Text>
            </TouchableOpacity>
          </View>
          <Card>
            <CardHeader>
              <CardTitle>Transcrição de objetos</CardTitle>
            </CardHeader>
            <CardContent  >
              <Text className="bg-[#303850] border border-slate-700 p-4 rounded-xl text-base text-white leading-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
