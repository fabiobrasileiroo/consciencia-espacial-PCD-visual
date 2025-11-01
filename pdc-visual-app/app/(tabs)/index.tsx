import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { styles } from './styles';
import { useApp } from '@/contexts/AppContext';
import { Audio } from 'expo-av';

const Logo = require('@/assets/images/logo.png');
const Glasses = require('@/assets/images/glasses.png');
const Battery = require('@/assets/images/battery.png');
const Circle = require('@/assets/images/circle.png');
const Thermometer = require('@/assets/images/termometer.png');
const Clock = require('@/assets/images/clock.png');
const Warning = require('@/assets/images/warning.png');
const Sound = require('@/assets/images/sound.png');
const Bluetooth = require('@/assets/images/bluetooth.png');
const Switch = require('@/assets/images/switch.png');

export default function HomeScreen() {
  const { mode, setMode, connectionStatus, setConnectionStatus, volume } = useApp();

  const handleTestSound = async () => {
    try {
      console.log('Testando som com feedback');
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep.mp4'),
        { shouldPlay: true, volume: volume / 100 }
      );
      
      await sound.playAsync();
      
      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);
      
    } catch (error) {
      console.log('Erro no som, usando fallback:', error);
    }
  };

  const handleChangeMode = () => {
    const newMode = mode === 'som' ? 'vibração' : 'som';
    setMode(newMode);
    console.log(`Modo alterado para ${newMode}`);
  };

  const handleConnectBluetooth = () => {
    const newStatus = connectionStatus === 'desconectado' ? 'conectado' : 'desconectado';
    setConnectionStatus(newStatus);
    console.log(`Status alterado para ${newStatus}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={Logo} 
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo do aplicativo Lucoi"
      />

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.iconTextRow}>
            <Image 
              source={Glasses} 
              style={styles.largeIcon}
              resizeMode="contain"
              accessibilityLabel="Óculos inteligentes"
            />
            <View>
              <Text 
                style={styles.largeStatusText}
                accessibilityLabel="Dispositivo ligado"
              >
                Dispositivo ligado!
              </Text>
              <Text 
                style={styles.subText}
                accessibilityLabel={`Tempo estimado de duração da bateria: 2 horas e 30 minutos`}
              >
                2h 30min
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.iconTextRow}>
            <Image 
              source={Battery} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Bateria"
            />
            <Text 
              style={styles.subText}
              accessibilityLabel={`Bateria em 100 por cento`}
            >
              100%
            </Text>
          </View>
          <View 
            style={[
              styles.connectedTag,
              connectionStatus === 'conectado' ? styles.connectedTagActive : styles.connectedTagInactive
            ]}
            accessibilityLabel={`Status de conexão: ${connectionStatus === 'conectado' ? 'conectado' : 'desconectado'}`}
          >
            <Image
              source={Circle}
              style={styles.circle}
              resizeMode="contain"
              accessibilityLabel="Indicador de status"
            />
            <Text style={styles.connectedText}>
              {connectionStatus === 'conectado' ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text 
          style={styles.sectionTitle}
          accessibilityLabel="Histórico"
        >
          Histórico
        </Text>
        <View style={styles.horizontalCardsContainer}>
          <View style={styles.subCard}>
            <Image 
              source={Thermometer} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Termômetro"
            />
            <Text 
              style={styles.subCardText}
              accessibilityLabel="Temperatura média detectada: 32 graus Celsius"
            >
              32°C
            </Text>
          </View>
          
          <View style={styles.subCard}>
            <Image 
              source={Clock} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Relógio"
            />
            <Text 
              style={styles.subCardText}
              accessibilityLabel="Tempo médio de uso do dispositivo: 5 horas"
            >
              5h
            </Text>
          </View>
          
          <View style={styles.subCard}>
            <Image 
              source={Warning} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Aviso"
            />
            <Text 
              style={styles.subCardText}
              accessibilityLabel="3 avisos detectados"
            >
              3 avisos
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.buttonCard}
        onPress={handleTestSound} // Use handleTestSoundSimple para versão mais simples
        accessibilityRole="button"
        accessibilityLabel="Botão testar som"
        accessibilityHint="Pressione para testar o som do dispositivo. Será emitido um beep."
      >
        <View style={styles.rowBetween}>
          <View style={styles.iconTextRow}>
            <Image 
              source={Sound} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Ícone de som"
            />
            <Text style={styles.buttonText}>Testar som</Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={[styles.slider, { width: `${volume}%` }]} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonsRow}>
        <TouchableOpacity 
          style={styles.button2}
          onPress={handleChangeMode}
          accessibilityRole="button"
          accessibilityLabel={`Botão mudar modo. Modo atual: ${mode === 'som' ? 'som' : 'vibração'}`}
          accessibilityHint={`Pressione para alterar o modo. Ao pressionar será anunciado: modo alterado para ${mode === 'som' ? 'vibração' : 'som'}`}
        >
          <Image 
            source={Switch} 
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de alternância"
          />
          <Text style={styles.buttonText}>
            Modo: {mode === 'som' ? 'Som' : 'Vibração'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button2}
          onPress={handleConnectBluetooth}
          accessibilityRole="button"
          accessibilityLabel={`Botão ${connectionStatus === 'conectado' ? 'desconectar' : 'conectar'} Bluetooth. Status atual: ${connectionStatus}`}
          accessibilityHint={`Pressione para ${connectionStatus === 'conectado' ? 'desconectar' : 'conectar'} o Bluetooth. Ao pressionar será anunciado: ${connectionStatus === 'conectado' ? 'desconectado' : 'conectado'}`}
        >
          <Image 
            source={Bluetooth} 
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone Bluetooth"
          />
          <Text style={styles.buttonText}>
            {connectionStatus === 'conectado' ? 'Desconectar' : 'Conectar'} Bluetooth
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text 
          style={styles.sectionTitle}
          accessibilityLabel="Transcrição de objetos"
        >
          Transcrição de objetos
        </Text>
        <Text 
          style={styles.lorem}
          accessibilityLabel="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </Text>
      </View>
    </ScrollView>
  );
}