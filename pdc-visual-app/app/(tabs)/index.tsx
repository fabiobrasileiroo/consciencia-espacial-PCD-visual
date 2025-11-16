import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, RefreshControl } from 'react-native';
import { styles } from './styles';
import { useApp } from '@/contexts/AppContext';
import { Audio } from 'expo-av';
import { BluetoothService } from '@/services/bluetooth-service';
import { HistoryItemCard } from '@/components/history-item-card';
import { Toast } from '@/components/toast';

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
  const {
    mode,
    setMode,
    connectionStatus,
    setConnectionStatus,
    volume,
    getSystemVolume,
    detectionHistory,
    currentTranscription,
    wsConnected,
    connectWebSocket,
    disconnectWebSocket,
    testWithHistoryItem,
    stats,
    serverOnline,
    connectedDevices,
    toast,
    showToast,
    hideToast,
  } = useApp();

  const [bluetoothService] = useState(() => new BluetoothService());
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Verificar conexão ESP32 ao carregar
    checkESP32Connection();
  }, []);

  const checkESP32Connection = async () => {
    const isConnected = await bluetoothService.isConnectedToESP32();
    setEsp32Connected(isConnected);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    try {
      // Reconectar WebSocket se desconectado
      if (!wsConnected) {
        showToast('Reconectando ao servidor...', 'info');
        connectWebSocket();
      } else {
        showToast('Atualizando dados...', 'info');
      }

      // Verificar conexão ESP32
      await checkESP32Connection();

      // Aguardar um pouco para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (wsConnected) {
        showToast('Dados atualizados!', 'success');
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      showToast('Erro ao atualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [wsConnected, connectWebSocket, showToast]);

  const handleTestSound = async () => {
    try {
      console.log('Testando som com feedback');

      // Obter volume real do sistema
      const systemVolume = await getSystemVolume();
      console.log(`Volume do sistema: ${systemVolume}%`);

      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep.mp4'),
        { shouldPlay: true, volume: systemVolume / 100 }
      );

      await sound.playAsync();

      showToast(`Som testado! Volume: ${systemVolume}%`, 'success');

      setTimeout(() => {
        sound.unloadAsync();
      }, 1000);

    } catch (error) {
      console.log('Erro no som:', error);
      showToast('Erro ao testar som', 'error');
    }
  }; const handleChangeMode = () => {
    const newMode = mode === 'som' ? 'vibração' : 'som';
    setMode(newMode);
    console.log(`Modo alterado para ${newMode}`);
  };

  const handleConnectBluetooth = async () => {
    try {
      if (connectionStatus === 'conectado') {
        // Desconectar
        setConnectionStatus('desconectado');
        setEsp32Connected(false);
        disconnectWebSocket();
        console.log('Desconectado do Bluetooth');
      } else {
        // Verificar se Bluetooth está ligado
        const isEnabled = await bluetoothService.isBluetoothEnabled();

        if (!isEnabled) {
          // Solicitar permissão para ligar Bluetooth
          Alert.alert(
            'Bluetooth Desligado',
            'O Bluetooth está desligado. Deseja ligar para conectar ao fone?',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
              },
              {
                text: 'Ligar',
                onPress: async () => {
                  const hasPermission = await bluetoothService.requestBluetoothPermission();
                  if (hasPermission) {
                    await connectToESP32Device();
                  }
                },
              },
            ]
          );
        } else {
          await connectToESP32Device();
        }
      }
    } catch (error) {
      console.error('Erro ao conectar Bluetooth:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao Bluetooth.');
    }
  };

  const connectToESP32Device = async () => {
    const connected = await bluetoothService.connectToESP32();

    if (connected) {
      setConnectionStatus('conectado');
      setEsp32Connected(true);

      // Conectar WebSocket para receber dados
      connectWebSocket();

      showToast('ESP32 conectado com sucesso!', 'success');
    } else {
      showToast('Falha ao conectar ao ESP32', 'error');
    }
  }; const handleDeleteHistoryItem = (id: string) => {
    // Implementar lógica de deletar item do histórico
    console.log('Deletar item:', id);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#22C55E"
          colors={['#22C55E', '#3B82F6']}
          progressBackgroundColor="#1e293b"
        />
      }
    >
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
                accessibilityLabel={`Tempo de uso desde que o servidor iniciou: ${stats.usageTime}`}
              >
                {stats.usageTime}
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
              accessibilityLabel={`Servidor ${serverOnline ? 'online' : 'offline'}`}
            >
              {serverOnline ? 'Servidor online' : 'Servidor offline'}
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
        <View style={styles.rowBetween}>
          <Text
            style={styles.sectionTitle}
            accessibilityLabel="Histórico de detecções"
          >
            Histórico de Detecções
          </Text>
          <View
            style={[
              styles.wsStatusTag,
              wsConnected ? styles.wsConnectedTag : styles.wsDisconnectedTag
            ]}
            accessibilityLabel={`WebSocket ${wsConnected ? 'conectado' : 'desconectado'}`}
          >
            <View style={[styles.wsCircle, wsConnected && styles.wsCircleActive]} />
            <Text style={styles.wsStatusText}>
              {wsConnected ? 'WS Ativo' : 'WS Inativo'}
            </Text>
          </View>
        </View>

        {detectionHistory.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            {detectionHistory.slice(0, 5).map((item) => (
              <HistoryItemCard
                key={item.id}
                id={item.id}
                text={item.text}
                timestamp={item.timestamp}
                onTest={() => testWithHistoryItem(item)}
                onDelete={() => handleDeleteHistoryItem(item.id)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHistoryText}>
            Nenhuma detecção registrada ainda. Conecte-se para começar.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text
          style={styles.sectionTitle}
          accessibilityLabel="Estatísticas"
        >
          Estatísticas
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
              accessibilityLabel={`Temperatura: ${stats.temperature} graus Celsius`}
            >
              {stats.temperature}°C
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
              accessibilityLabel={`Tempo de uso: ${stats.usageTime}`}
            >
              {stats.usageTime}
            </Text>
          </View>

          <View style={styles.subCard}>
            <Image
              source={Warning}
              style={styles.smallIcon}
              resizeMode="contain"
              accessibilityLabel="Avisos"
            />
            <Text
              style={styles.subCardText}
              accessibilityLabel={`${stats.warnings} avisos detectados`}
            >
              {stats.warnings} avisos
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
          accessibilityLabel="Transcrição em tempo real"
        >
          Transcrição em Tempo Real
        </Text>
        {currentTranscription ? (
          <View>
            <Text
              style={[styles.lorem, { fontSize: 14, lineHeight: 22 }]}
              accessibilityLabel={`Transcrição atual: ${currentTranscription}`}
            >
              {currentTranscription}
            </Text>
            {wsConnected && (
              <Text style={[styles.subText, { fontSize: 10, marginTop: 8, textAlign: 'right' }]}>
                🔴 Ao vivo
              </Text>
            )}
          </View>
        ) : (
          <Text
            style={styles.emptyHistoryText}
            accessibilityLabel="Aguardando dados de transcrição"
          >
            Aguardando detecção de objetos...
            {'\n'}
            {wsConnected
              ? 'Conectado e pronto para receber dados.'
              : 'Conecte-se ao WebSocket para começar.'}
          </Text>
        )}
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </ScrollView>
  );
}