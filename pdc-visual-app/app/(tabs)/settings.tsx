import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { styles } from './styles';
import { useApp } from '@/contexts/AppContext';

const LogoImage = require('@/assets/images/logo.png');
const Increase = require('@/assets/images/increase.png');
const Decrease = require('@/assets/images/decrease.png');
const SoundImage = require('@/assets/images/sound.png');
const Info = require('@/assets/images/warning.png');
const Devices = require('@/assets/images/devices.png');

export default function SettingsScreen() {
  const { volume, setVolume, connectionStatus, mode } = useApp();

  const handleIncreaseVolume = () => {
    if (volume < 100) {
      const newVolume = Math.min(volume + 10, 100);
      setVolume(newVolume);
    }
  };

  const handleDecreaseVolume = () => {
    if (volume > 0) {
      const newVolume = Math.max(volume - 10, 0);
      setVolume(newVolume);
    }
  };

  const handleHelpFAQ = () => {
    console.log('Ajuda e FAQ pressionado');
  };

  const handleAboutApp = () => {
    console.log('Sobre o Aplicativo pressionado');
  };

  const getAirpodsStatus = () => {
    return mode === 'som' ? 'conectado' : 'desconectado';
  };

  const getBraceletStatus = () => {
    return mode === 'vibração' ? 'conectado' : 'desconectado';
  };

  const getStatusStyle = (status: string) => {
    return status === 'conectado' ? styles.connectedText2 : styles.disconnectedText;
  };

  const getStatusText = (status: string) => {
    return status === 'conectado' ? 'Conectado' : 'Desligado';
  };

  return (
    <View style={styles.container}>
      <Image 
        source={LogoImage} 
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo do aplicativo Lucoi"
      />

      <View style={styles.card}>
        <View style={styles.rowBetween2}>
          <Image 
            source={Devices} 
            style={styles.largeIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de dispositivos"
          />
          <Text 
            style={styles.sectionTitle}
            accessibilityLabel="Dispositivos conectados"
          >
            Dispositivos conectados
          </Text>
        </View>
        
        <View style={styles.rowBetween}>
          <Text 
            style={styles.subText}
            accessibilityLabel="LUMI SmartGlasses versão 1.0"
          >
            - LUMI - SmartGlasses v1.0
          </Text>
          <Text 
            style={getStatusStyle(connectionStatus)}
            accessibilityLabel={connectionStatus === 'conectado' ? 'Conectado' : 'Desconectado'}
          >
            {getStatusText(connectionStatus)}
          </Text>
        </View>
        
        <View style={styles.rowBetween}>
          <Text 
            style={styles.subText}
            accessibilityLabel="LUMI SmartBracelet versão 1.0"
          >
            - LUMI - SmartBracelet v1.0
          </Text>
          <Text 
            style={getStatusStyle(getBraceletStatus())}
            accessibilityLabel={getBraceletStatus() === 'conectado' ? 'Conectado' : 'Desligado'}
          >
            {getStatusText(getBraceletStatus())}
          </Text>
        </View>
        
        <View style={styles.rowBetween}>
          <Text 
            style={styles.subText}
            accessibilityLabel="Apple Airpods versão 1.0"
          >
            - Apple - Airpods v1.0
          </Text>
          <Text 
            style={getStatusStyle(getAirpodsStatus())}
            accessibilityLabel={getAirpodsStatus() === 'conectado' ? 'Conectado' : 'Desligado'}
          >
            {getStatusText(getAirpodsStatus())}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text 
          style={styles.sectionTitle}
          accessibilityLabel="Volume"
        >
          Volume
        </Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={styles.button2}
            onPress={handleDecreaseVolume}
            accessibilityRole="button"
            accessibilityLabel="Botão diminuir volume"
            accessibilityHint="Pressione para diminuir o volume. Ao pressionar será anunciado: volume diminuído"
          >
            <Image 
              source={Decrease} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Ícone diminuir"
            />
            <Text style={styles.buttonText}>Abaixar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button2}
            onPress={handleIncreaseVolume}
            accessibilityRole="button"
            accessibilityLabel="Botão aumentar volume"
            accessibilityHint="Pressione para aumentar o volume. Ao pressionar será anunciado: volume aumentado"
          >
            <Image 
              source={Increase} 
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Ícone aumentar"
            />
            <Text style={styles.buttonText}>Aumentar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rowBetween}>
          <Image 
            source={SoundImage} 
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de som"
          />
          <View style={styles.sliderContainer2}>
            <View style={[styles.slider, { width: `${volume}%` }]} />
          </View>
          <Text 
            style={styles.volumeText}
            accessibilityLabel={`Volume atual: ${volume} por cento`}
          >
            {volume}%
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text 
          style={styles.sectionTitle}
          accessibilityLabel="Suporte e Informações"
        >
          Suporte e Informações
        </Text>
        <TouchableOpacity 
          style={styles.iconTextRow}
          onPress={handleHelpFAQ}
          accessibilityRole="link"
          accessibilityLabel="Link Ajuda e FAQ"
        >
          <Image 
            source={Info} 
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de informação"
          />
          <Text style={styles.subText}>Ajuda e FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconTextRow}
          onPress={handleAboutApp}
          accessibilityRole="link"
          accessibilityLabel="Opção Sobre o Aplicativo"
        >
          <Image 
            source={Info} 
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de informação"
          />
          <Text style={styles.subText}>Sobre o Aplicativo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}