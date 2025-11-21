import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { styles } from '../../styles/styles';
import { useApp } from '@/contexts/AppContext';
import { Audio } from 'expo-av';
import { BluetoothService } from '@/services/bluetooth-service';
import { HistoryItemCard } from '@/components/history-item-card';
import { Toast } from '@/components/toast';
import { SkeletonCard, SkeletonStats } from '@/components/skeleton-loader';
import {
  Camera,
  Mic,
  Volume2,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Zap,
  AlertTriangle,
  Info,
  Headphones
} from 'lucide-react-native';

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
    detectedObjectDistance,
    toast,
    showToast,
    hideToast,
    allSystemsConnected,
  } = useApp();

  const [bluetoothService] = useState(() => new BluetoothService());
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [operationMode, setOperationMode] = useState<'realtime' | 'manual'>('realtime');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  useEffect(() => {
    checkESP32Connection();
    checkCameraConnection();
  }, []);

  const checkCameraConnection = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/status');
      const data = await response.json();
      setCameraConnected(data.esp32Status?.camera?.connected || false);
    } catch (error) {
      console.error('Erro ao verificar câmera:', error);
      setCameraConnected(false);
    }
  };

  const checkESP32Connection = async () => {
    const isConnected = await bluetoothService.isConnectedToESP32();
    setEsp32Connected(isConnected);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    try {
      if (!wsConnected) {
        showToast('Reconectando ao servidor...', 'info');
        connectWebSocket();
      } else {
        showToast('Atualizando dados...', 'info');
      }

      await checkESP32Connection();

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
  };

  const handleTestTTS = async () => {
    try {
      setIsPlayingTTS(true);
      showToast('Reproduzindo texto de teste...', 'info');
      
      const testText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      showToast('Texto reproduzido com sucesso!', 'success');
    } catch (error) {
      console.error('Erro no TTS:', error);
      showToast('Erro ao reproduzir texto', 'error');
    } finally {
      setIsPlayingTTS(false);
    }
  };

  const handleChangeMode = () => {
    const newMode = mode === 'som' ? 'vibração' : 'som';
    setMode(newMode);
    showToast(`Modo alterado para ${newMode}`, 'success');
  };

  const handleConnectBluetooth = async () => {
    try {
      if (connectionStatus === 'conectado') {
        setConnectionStatus('desconectado');
        setEsp32Connected(false);
        disconnectWebSocket();
        showToast('Dispositivo Bluetooth desconectado', 'info');
      } else {
        const isEnabled = await bluetoothService.isBluetoothEnabled();

        if (!isEnabled) {
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

      connectWebSocket();

      showToast('ESP32 conectado com sucesso!', 'success');
    } else {
      showToast('Falha ao conectar ao ESP32', 'error');
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    console.log('Deletar item:', id);
    showToast('Item removido do histórico', 'info');
  };

  const toggleOperationMode = async () => {
    const newMode = operationMode === 'realtime' ? 'manual' : 'realtime';

    try {
      const response = await fetch('http://localhost:3000/api/operation-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: newMode,
          triggeredBy: 'mobile-app'
        }),
      });

      if (response.ok) {
        setOperationMode(newMode);
        showToast(
          `Modo ${newMode === 'realtime' ? 'Tempo Real' : 'Manual'} ativado`,
          'success'
        );
      } else {
        showToast('Erro ao alterar modo', 'error');
      }
    } catch (error) {
      console.error('Erro ao alterar modo:', error);
      showToast('Erro ao conectar com servidor', 'error');
    }
  };

  const captureManualDetection = async () => {
    if (!wsConnected || !cameraConnected) {
      showToast('Conecte-se ao servidor e à câmera primeiro', 'error');
      return;
    }

    setIsCapturing(true);
    showToast('Capturando descrição...', 'info');

    try {
      const response = await fetch('http://localhost:3000/api/esp32-cam/capture-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Captura solicitada! Aguardando...', 'success');
        console.log('Captura manual solicitada:', data);
      } else {
        showToast('Erro ao solicitar captura', 'error');
      }
    } catch (error) {
      console.error('Erro ao capturar:', error);
      showToast('Erro ao conectar com servidor Python', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const getIconForObject = (text: string) => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('câmera') || lowerText.includes('camera')) {
      return <Camera size={20} color="#22C55E" />;
    }
    if (lowerText.includes('som') || lowerText.includes('áudio') || lowerText.includes('audio')) {
      return <Volume2 size={20} color="#3B82F6" />;
    }
    if (lowerText.includes('microfone') || lowerText.includes('mic')) {
      return <Mic size={20} color="#8B5CF6" />;
    }
    if (lowerText.includes('alerta') || lowerText.includes('aviso') || lowerText.includes('perigo')) {
      return <AlertTriangle size={20} color="#EF4444" />;
    }
    if (lowerText.includes('energia') || lowerText.includes('bateria')) {
      return <Zap size={20} color="#F59E0B" />;
    }

    return <Info size={20} color="#64748B" />;
  };

  return (
    <>
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
          accessibilityLabel="LUMI"
          accessibilityRole="image"
          accessible={true}
        />

        {allSystemsConnected && (
          <View style={[styles.card, { backgroundColor: '#22C55E20', borderLeftWidth: 4, borderLeftColor: '#22C55E' }]}>
            <View style={styles.rowBetween}>
              <View style={styles.iconTextRow}>
                <View style={[styles.circle, { backgroundColor: '#22C55E', width: 12, height: 12, borderRadius: 6 }]} />
                <Text style={[styles.sectionTitle, { color: '#22C55E' }]}>
                  Todos os sistemas conectados
                </Text>
              </View>
              <Text style={[styles.subText, { color: '#22C55E', fontWeight: 'bold' }]}>
                ✓
              </Text>
            </View>
          </View>
        )}

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
                  accessibilityLabel={cameraConnected ? "Câmera conectada" : "Dispositivo offline"}
                >
                  {cameraConnected ? 'Câmera Conectada!' : 'Câmera Offline'}
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

          {wsConnected && (
            <View style={styles.rowBetween}>
              <View style={styles.iconTextRow}>
                {serverOnline ? (
                  <Wifi size={20} color="#22C55E" />
                ) : (
                  <WifiOff size={20} color="#EF4444" />
                )}
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
                <View style={[
                  styles.circle,
                  {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: connectionStatus === 'conectado' ? '#22C55E' : '#64748B'
                  }
                ]} />
                <Text style={styles.connectedText}>
                  {connectionStatus === 'conectado' ? 'Conectado' : 'Desconectado'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {wsConnected && cameraConnected && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>
                Modo de Operação
              </Text>
              <View style={[
                styles.wsStatusTag,
                operationMode === 'realtime' ? styles.wsConnectedTag : { backgroundColor: '#3B82F6' }
              ]}>
                {operationMode === 'realtime' ? (
                  <Play size={12} color="#FFF" />
                ) : (
                  <Pause size={12} color="#FFF" />
                )}
                <Text style={[styles.wsStatusText, { marginLeft: 4 }]}>
                  {operationMode === 'realtime' ? 'Tempo Real' : 'Manual'}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12, gap: 12 }}>
              <TouchableOpacity
                style={[
                  styles.buttonCard,
                  { backgroundColor: operationMode === 'realtime' ? '#334155' : '#475569' }
                ]}
                onPress={toggleOperationMode}
                accessibilityRole="button"
                accessibilityLabel={`Alternar para modo ${operationMode === 'realtime' ? 'manual' : 'tempo real'}`}
              >
                <View style={styles.rowBetween}>
                  <View style={styles.iconTextRow}>
                    {operationMode === 'realtime' ? (
                      <Pause size={24} color="#22C55E" />
                    ) : (
                      <Play size={24} color="#3B82F6" />
                    )}
                    <Text style={styles.buttonText}>
                      {operationMode === 'realtime' ? 'Mudar para Manual' : 'Mudar para Tempo Real'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {operationMode === 'manual' && (
                <TouchableOpacity
                  style={[
                    styles.buttonCard,
                    { backgroundColor: isCapturing ? '#64748B' : '#3B82F6' }
                  ]}
                  onPress={captureManualDetection}
                  disabled={isCapturing}
                  accessibilityRole="button"
                  accessibilityLabel="Capturar descrição agora"
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.iconTextRow}>
                      {isCapturing ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Camera size={24} color="#FFF" />
                      )}
                      <Text style={[styles.buttonText, { color: '#FFF' }]}>
                        {isCapturing ? 'Capturando...' : 'Capturar Agora'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

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
                  id={item.id}
                  text={item.text}
                  timestamp={item.timestamp}
                  onTest={() => handleTestItem(item.id)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyHistoryText}>
              Nenhuma detecção registrada ainda. Conecte-se para começar.
            </Text>
          )}
        </View>

        <View style={[styles.card, { marginBottom: 30 }]}>
          <View style={styles.rowBetween}>
            <Text
              style={styles.sectionTitle}
              accessibilityLabel="Transcrição em tempo real"
            >
              Transcrição em Tempo Real
            </Text>
            
            {currentTranscription && (
              <TouchableOpacity
                style={[
                  styles.button2,
                  { 
                    backgroundColor: isPlayingTTS ? '#64748B' : '#3B82F6',
                    paddingHorizontal: 12,
                    paddingVertical: 6
                  }
                ]}
                onPress={handleTestTTS}
                disabled={isPlayingTTS}
                accessibilityRole="button"
                accessibilityLabel="Testar text-to-speech"
              >
                {isPlayingTTS ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Volume2 size={16} color="#FFF" />
                )}
                <Text style={[styles.buttonText, { color: '#FFF', marginLeft: 4, fontSize: 12 }]}>
                  {isPlayingTTS ? 'Reproduzindo...' : 'Ouvir'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
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
                  Ao vivo
                </Text>
              )}
            </View>
          ) : (
            <Text
              style={styles.emptyHistoryText}
              accessibilityLabel="Aguardando dados de transcrição"
            >
              {!serverOnline ? 'Servidor offline. Reconecte para receber dados.' : 'Aguardando detecção de objetos...\n' + (wsConnected ? 'Conectado e pronto para receber dados.' : 'Conecte-se ao WebSocket para começar.')}
            </Text>
          )}
        </View>

        {wsConnected && serverOnline && (
          <View style={styles.card}>
            <Text
              style={styles.sectionTitle}
              accessibilityLabel="Estatísticas"
            >
              Estatísticas
            </Text>
            {refreshing ? (
              <SkeletonStats />
            ) : (
              <>
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

                {detectedObjectDistance !== null && (
                  <View style={{ marginTop: 16, padding: 12, backgroundColor: '#334155', borderRadius: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>📏</Text>
                      <Text style={[styles.subText, { fontSize: 14, fontWeight: '600' }]}>
                        Objeto à frente:
                      </Text>
                      <Text style={[styles.subText, { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#22C55E' }]}>
                        {detectedObjectDistance}cm
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.buttonCard}
          onPress={handleTestSound}
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
            <Headphones size={20} color="#FFF" />
            <Text style={styles.buttonText}>
              {mode === 'som' ? 'Som' : 'Vibração'}
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
              {connectionStatus === 'conectado' ? 'Desconectar' : 'Conectar'} 
            </Text>
          </TouchableOpacity>
        </View>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      </ScrollView>
    </>
  );
}

const handleTestItem = (id: string) => {
  // Implementar
  console.log('Testando item:', id);
};

const handleDeleteItem = (id: string) => {
  // Implementar
};