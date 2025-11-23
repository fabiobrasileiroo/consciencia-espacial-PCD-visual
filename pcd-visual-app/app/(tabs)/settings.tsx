import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { styles } from '../../styles/styles';
import { useApp } from '@/contexts/AppContext';
import { BluetoothService, BluetoothDevice } from '@/services/bluetooth-service';
import { SkeletonCard } from '@/components/skeleton-loader';
import {
  Globe,
  Plug,
  Ruler,
  Vibrate,
  Camera,
  Smartphone,
  Settings as SettingsIcon,
  Thermometer,
  Droplets,
  Signal,
  RefreshCw,
  Wifi,
  MapPin,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Heart,
  Save,
  X,
  Lightbulb
} from 'lucide-react-native';

const LogoImage = require('@/assets/images/logo.png');
const Increase = require('@/assets/images/increase.png');
const Decrease = require('@/assets/images/decrease.png');
const SoundImage = require('@/assets/images/sound.png');
const Info = require('@/assets/images/warning.png');
const Devices = require('@/assets/images/devices.png');

export default function SettingsScreen() {
  const {
    volume,
    setVolume,
    setSystemVolume,
    showToast,
    wsConnected,
    connectWebSocket,
    serverOnline,
    connectedDevices,
    esp32Status,
    systemsHealth,
    apiUrl,
    setApiUrl,
  } = useApp();
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bluetoothService] = useState(() => new BluetoothService());
  const [customUrl, setCustomUrl] = useState(apiUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // MOVIDO para dentro do componente

  // Atualizar URL local quando apiUrl do contexto mudar
  useEffect(() => {
    setCustomUrl(apiUrl);
  }, [apiUrl]);

  const handleSaveCustomUrl = async () => {
    if (!customUrl.trim()) {
      showToast('URL não pode estar vazia', 'error');
      return;
    }

    // Validar formato básico de URL
    if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
      showToast('URL deve começar com http:// ou https://', 'error');
      return;
    }

    await setApiUrl(customUrl.trim());
    setIsEditingUrl(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setScanning(true);
      const devices = await bluetoothService.scanDevices();
      setBluetoothDevices(devices);
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
      showToast('Erro ao carregar dispositivos Bluetooth', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleIncreaseVolume = async () => {
    if (volume < 100) {
      const newVolume = Math.min(volume + 10, 100);
      await setSystemVolume(newVolume);
      showToast(`Volume aumentado para ${newVolume}%`, 'success');
    }
  };

  const handleDecreaseVolume = async () => {
    if (volume > 0) {
      const newVolume = Math.max(volume - 10, 0);
      await setSystemVolume(newVolume);
      showToast(`Volume reduzido para ${newVolume}%`, 'success');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    try {
      showToast('Atualizando dispositivos...', 'info');
      await loadDevices();
      showToast('Dispositivos atualizados!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      showToast('Erro ao atualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [loadDevices, showToast]);

  const handleHelpFAQ = () => {
    console.log('Abrir drawer de dúvidas frequentes');
    showToast('Abrindo dúvidas frequentes...', 'info');
  };

  const handleAboutApp = () => {
    console.log('Sobre o Aplicativo pressionado');
    showToast('Informações sobre o aplicativo LUMI', 'info');
  };

  // Dropdown state for Support sections
  const [expandedFAQ, setExpandedFAQ] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState(false);

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
        source={LogoImage}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Logo do aplicativo Lucoi"
      />

      {/* Status do Servidor WebSocket */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.iconTextRow}>
            <Image
              source={Info}
              style={styles.largeIcon}
              resizeMode="contain"
              accessibilityLabel="Ícone de servidor"
            />
            <Text
              style={styles.sectionTitle}
              accessibilityLabel="Status do servidor"
            >
              Servidor
            </Text>
          </View>
          <View
            style={[
              styles.deviceTag,
              wsConnected ? styles.deviceTagConnected : styles.deviceTagDisconnected
            ]}
          >
            <Text
              style={styles.deviceTagText}
              accessibilityLabel={serverOnline ? 'Servidor online' : 'Servidor offline'}
            >
              {serverOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {!serverOnline && (
          <TouchableOpacity
            style={[styles.button2, { marginTop: 12 }]}
            onPress={() => {
              connectWebSocket();
              showToast('Tentando reconectar ao servidor...', 'info');
            }}
            accessibilityRole="button"
            accessibilityLabel="Reconectar ao servidor"
          >
            <Text style={styles.buttonText}>Reconectar</Text>
          </TouchableOpacity>
        )}
      </View>

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
            accessibilityLabel="Dispositivos Bluetooth"
          >
            Dispositivos Bluetooth
          </Text>
        </View>

        {scanning ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.subText}>Escaneando dispositivos...</Text>
          </View>
        ) : (
          <>
            {bluetoothDevices.length > 0 ? (
              // ✅ CORREÇÃO: key apenas no elemento pai do map
              bluetoothDevices.map((device) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
                  <Text style={styles.subText} accessibilityLabel={device.name}>
                    - {device.name}
                  </Text>
                  <View style={[styles.deviceTag, device.connected ? styles.deviceTagConnected : styles.deviceTagDisconnected]}>
                    <Text style={styles.deviceTagText} accessibilityLabel={device.connected ? 'Conectado' : 'Desconectado'}>
                      {device.connected ? 'Conectado' : 'Desconectado'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyHistoryText}>
                Nenhum dispositivo encontrado
              </Text>
            )}

            <TouchableOpacity
              style={[styles.button2, { marginTop: 12 }]}
              onPress={loadDevices}
              accessibilityRole="button"
              accessibilityLabel="Atualizar lista de dispositivos"
            >
              <RefreshCw color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Atualizar Dispositivos</Text>
            </TouchableOpacity>

            {serverOnline && (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Wifi color="#22C55E" size={16} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Conexões Ativas</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ backgroundColor: connectedDevices.app > 0 ? '#22C55E20' : '#64748B20', padding: 12, borderRadius: 12, marginBottom: 6 }}>
                      <Smartphone color={connectedDevices.app > 0 ? '#22C55E' : '#64748B'} size={24} />
                    </View>
                    <Text style={[styles.subText, { fontSize: 12, fontWeight: '600' }]}>Apps</Text>
                    <View style={{ backgroundColor: connectedDevices.app > 0 ? '#22C55E' : '#64748B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>{connectedDevices.app}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ backgroundColor: connectedDevices.esp32Pai > 0 ? '#22C55E20' : '#64748B20', padding: 12, borderRadius: 12, marginBottom: 6 }}>
                      <SettingsIcon color={connectedDevices.esp32Pai > 0 ? '#22C55E' : '#64748B'} size={24} />
                    </View>
                    <Text style={[styles.subText, { fontSize: 12, fontWeight: '600' }]}>PAI</Text>
                    <View style={{ backgroundColor: connectedDevices.esp32Pai > 0 ? '#22C55E' : '#64748B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>{connectedDevices.esp32Pai}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ backgroundColor: connectedDevices.esp32Cam > 0 ? '#22C55E20' : '#64748B20', padding: 12, borderRadius: 12, marginBottom: 6 }}>
                      <Camera color={connectedDevices.esp32Cam > 0 ? '#22C55E' : '#64748B'} size={24} />
                    </View>
                    <Text style={[styles.subText, { fontSize: 12, fontWeight: '600' }]}>CAM</Text>
                    <View style={{ backgroundColor: connectedDevices.esp32Cam > 0 ? '#22C55E' : '#64748B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>{connectedDevices.esp32Cam}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Status dos Módulos ESP32 */}
      {!serverOnline && refreshing ? (
        <SkeletonCard />
      ) : serverOnline && esp32Status ? (
        <View style={styles.card}>
          <View style={styles.rowBetween2}>
            <Plug color="#22C55E" size={24} />
            <Text style={styles.sectionTitle}>
              Módulos ESP32
            </Text>
          </View>

          {/* PAI */}
          <View style={{ backgroundColor: esp32Status.pai.connected ? '#22C55E10' : '#64748B10', padding: 12, borderRadius: 12, marginBottom: 12, marginTop: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SettingsIcon color={esp32Status.pai.connected ? '#22C55E' : '#64748B'} size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>PAI (Mestre)</Text>
              </View>
              <View
                style={[
                  styles.deviceTag,
                  esp32Status.pai.connected ? styles.deviceTagConnected : styles.deviceTagDisconnected
                ]}
              >
                <Text style={styles.deviceTagText}>
                  {esp32Status.pai.connected ? '● Conectado' : '○ Offline'}
                </Text>
              </View>
            </View>
            {esp32Status.pai.connected && esp32Status.pai.lastSeen && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 28, marginTop: 4, opacity: 0.7 }}>
                <Clock color="#94A3B8" size={10} style={{ marginRight: 4 }} />
                <Text style={[styles.subText, { fontSize: 10 }]}>
                  Última atualização: {new Date(esp32Status.pai.lastSeen).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>

          {/* SENSOR */}
          <View style={{ backgroundColor: esp32Status.sensor.connected ? '#22C55E10' : '#64748B10', padding: 12, borderRadius: 12, marginBottom: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ruler color={esp32Status.sensor.connected ? '#22C55E' : '#64748B'} size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>Sensor (Distância)</Text>
              </View>
              <View
                style={[
                  styles.deviceTag,
                  esp32Status.sensor.connected ? styles.deviceTagConnected : styles.deviceTagDisconnected
                ]}
              >
                <Text style={styles.deviceTagText}>
                  {esp32Status.sensor.connected ? '● Conectado' : '○ Offline'}
                </Text>
              </View>
            </View>
            {esp32Status.sensor.connected && (
              <View style={{ marginLeft: 28, marginTop: 8 }}>
                {typeof esp32Status.sensor.distance === 'number' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={[styles.subText, { fontSize: 11, flex: 1 }]}>
                      <MapPin color="#94A3B8" size={12} style={{ marginRight: 6 }} /> Distância: <Text style={{ fontWeight: 'bold' }}>{esp32Status.sensor.distance}cm</Text>
                    </Text>
                    <View style={{
                      backgroundColor: esp32Status.sensor.level === 'danger' ? '#EF4444' : esp32Status.sensor.level === 'warning' ? '#F59E0B' : '#22C55E',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                        {esp32Status.sensor.level?.toUpperCase() || 'SAFE'}
                      </Text>
                    </View>
                  </View>
                )}
                {typeof esp32Status.sensor.temperature === 'number' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Thermometer color="#F59E0B" size={11} />
                      <Text style={[styles.subText, { fontSize: 11 }]}>
                        Temperatura: <Text style={{ fontWeight: 'bold' }}>{esp32Status.sensor.temperature.toFixed(1)}°C</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Droplets color="#3B82F6" size={11} />
                      <Text style={[styles.subText, { fontSize: 11 }]}>
                        Umidade: <Text style={{ fontWeight: 'bold' }}>{esp32Status.sensor.humidity?.toFixed(1)}%</Text>
                      </Text>
                    </View>
                  </View>
                )}
                {typeof esp32Status.sensor.rssi === 'number' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Signal color="#22C55E" size={11} />
                    <Text style={[styles.subText, { fontSize: 11 }]}>
                      Sinal: <Text style={{ fontWeight: 'bold' }}>{esp32Status.sensor.rssi}dBm</Text>
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* MOTOR */}
          <View style={{ backgroundColor: esp32Status.motor.connected ? '#22C55E10' : '#64748B10', padding: 12, borderRadius: 12, marginBottom: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Vibrate color={esp32Status.motor.connected ? '#22C55E' : '#64748B'} size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>Motor (Vibração)</Text>
              </View>
              <View
                style={[
                  styles.deviceTag,
                  esp32Status.motor.connected ? styles.deviceTagConnected : styles.deviceTagDisconnected
                ]}
              >
                <Text style={styles.deviceTagText}>
                  {esp32Status.motor.connected ? '● Conectado' : '○ Offline'}
                </Text>
              </View>
            </View>
            {esp32Status.motor.connected && typeof esp32Status.motor.vibrationLevel === 'number' && (
              <View style={{ marginLeft: 28, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.subText, { fontSize: 11, marginRight: 8 }]}>
                  Intensidade:
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((level, index) => (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: index === currentStep ? '#007AFF' : '#E5E5EA',
                        borderRadius: 4
                      }}
                    />
                  ))}
                </View>
                <Text style={[styles.subText, { fontSize: 11, marginLeft: 8, fontWeight: 'bold' }]}>
                  {esp32Status.motor.vibrationLevel}
                </Text>
              </View>
            )}
          </View>

          {/* CAMERA */}
          <View style={{ backgroundColor: esp32Status.camera.connected ? '#22C55E10' : '#64748B10', padding: 12, borderRadius: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Camera color={esp32Status.camera.connected ? '#22C55E' : '#64748B'} size={20} style={{ marginRight: 8 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>Câmera (Detecção)</Text>
              </View>
              <View
                style={[
                  styles.deviceTag,
                  esp32Status.camera.connected ? styles.deviceTagConnected : styles.deviceTagDisconnected
                ]}
              >
                <Text style={styles.deviceTagText}>
                  {esp32Status.camera.connected ? '● Conectado' : '○ Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Configuração da URL da API */}
      <View style={styles.card}>
        <View style={styles.rowBetween2}>
          <Globe color="#22C55E" size={24} />
          <Text style={styles.sectionTitle}>Configuração da API</Text>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subText, { fontSize: 12, marginBottom: 8, opacity: 0.7 }]}>
            URL atual: {apiUrl}
          </Text>

          {!isEditingUrl ? (
            <TouchableOpacity
              style={[styles.button2, { marginTop: 8 }]}
              onPress={() => setIsEditingUrl(true)}
              accessibilityRole="button"
              accessibilityLabel="Editar URL da API"
            >
              <Edit2 color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Alterar URL</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TextInput
                style={{
                  backgroundColor: '#334155',
                  color: '#FFFFFF',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#475569',
                }}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://192.168.1.100:3000"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                accessibilityLabel="Campo de URL da API"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.button2, { flex: 1, backgroundColor: '#22C55E' }]}
                  onPress={handleSaveCustomUrl}
                  accessibilityRole="button"
                  accessibilityLabel="Salvar URL"
                >
                  <Save color="#FFFFFF" size={16} />
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button2, { flex: 1, backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setCustomUrl(apiUrl);
                    setIsEditingUrl(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar edição"
                >
                  <X color="#FFFFFF" size={16} />
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 6 }}>
            <Lightbulb color="#F59E0B" size={14} style={{ marginTop: 2 }} />
            <Text style={[styles.subText, { fontSize: 11, opacity: 0.6, fontStyle: 'italic', flex: 1 }]}>
              Dica: Use o IP local da sua rede (ex: http://192.168.1.100:3000) para conectar ao servidor
            </Text>
          </View>
        </View>
      </View>

      {/* Systems Health */}
      {serverOnline && systemsHealth && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Heart color="#22C55E" size={24} fill="#22C55E" />
            <Text style={styles.sectionTitle}>
              Saúde dos Sistemas
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: systemsHealth.pai ? '#22C55E15' : '#EF444415',
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: systemsHealth.pai ? '#22C55E' : '#EF4444'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SettingsIcon color={systemsHealth.pai ? '#22C55E' : '#EF4444'} size={18} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>PAI (Controlador)</Text>
              </View>
              <View style={{
                backgroundColor: systemsHealth.pai ? '#22C55E' : '#EF4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                {systemsHealth.pai ? (
                  <CheckCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                ) : (
                  <XCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                  {systemsHealth.pai ? 'OK' : 'FALHA'}
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: systemsHealth.sensor ? '#22C55E15' : '#EF444415',
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: systemsHealth.sensor ? '#22C55E' : '#EF4444'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ruler color={systemsHealth.sensor ? '#22C55E' : '#EF4444'} size={18} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>Sensor (Distância)</Text>
              </View>
              <View style={{
                backgroundColor: systemsHealth.sensor ? '#22C55E' : '#EF4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                {systemsHealth.sensor ? (
                  <CheckCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                ) : (
                  <XCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                  {systemsHealth.sensor ? 'OK' : 'FALHA'}
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: systemsHealth.vibracall ? '#22C55E15' : '#EF444415',
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderLeftWidth: 4,
              borderLeftColor: systemsHealth.vibracall ? '#22C55E' : '#EF4444'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Vibrate color={systemsHealth.vibracall ? '#22C55E' : '#EF4444'} size={18} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>Vibracall (Motor)</Text>
              </View>
              <View style={{
                backgroundColor: systemsHealth.vibracall ? '#22C55E' : '#EF4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                {systemsHealth.vibracall ? (
                  <CheckCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                ) : (
                  <XCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                  {systemsHealth.vibracall ? 'OK' : 'FALHA'}
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: systemsHealth.camera ? '#22C55E15' : '#EF444415',
              padding: 12,
              borderRadius: 10,
              borderLeftWidth: 4,
              borderLeftColor: systemsHealth.camera ? '#22C55E' : '#EF4444'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Camera color={systemsHealth.camera ? '#22C55E' : '#EF4444'} size={18} style={{ marginRight: 10 }} />
                <Text style={[styles.subText, { fontWeight: '600' }]}>Câmera (Visão)</Text>
              </View>
              <View style={{
                backgroundColor: systemsHealth.camera ? '#22C55E' : '#EF4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                {systemsHealth.camera ? (
                  <CheckCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                ) : (
                  <XCircle color="#FFFFFF" size={12} style={{ marginRight: 4 }} />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                  {systemsHealth.camera ? 'OK' : 'FALHA'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

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

      <View style={[styles.card, { marginBottom: 30 }]}>
        <Text
          style={styles.sectionTitle}
          accessibilityLabel="Suporte e Informações"
        >
          Suporte e Informações
        </Text>

        {/* FAQ dropdown */}
        <TouchableOpacity
          style={styles.iconTextRow}
          onPress={() => {
            setExpandedFAQ(!expandedFAQ);
            handleHelpFAQ();
          }}
          accessibilityRole="button"
          accessibilityLabel="Abrir Ajuda e FAQ"
          accessibilityState={{ expanded: expandedFAQ }}
        >
          <Image
            source={Info}
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de informação"
          />
          <Text style={styles.subText}>Ajuda e FAQ</Text>
        </TouchableOpacity>

        {expandedFAQ && (
          <View style={{ paddingLeft: 40, paddingTop: 8, paddingBottom: 8 }}>
            <Text style={[styles.subText, { fontSize: 13, opacity: 0.9 }]}>
              Perguntas frequentes:
            </Text>
            <Text style={[styles.subText, { fontSize: 12, opacity: 0.8, marginTop: 6 }]}>
              • Como conectar um dispositivo Bluetooth: Vá em Dispositivos Bluetooth e pressione Atualizar.
            </Text>
            <Text style={[styles.subText, { fontSize: 12, opacity: 0.8, marginTop: 4 }]}>
              • Como reconectar ao servidor: Use o botão Reconectar no cartão Servidor.
            </Text>
            <Text style={[styles.subText, { fontSize: 12, opacity: 0.8, marginTop: 8 }]}>
              Contato do suporte: suporte@lumi.example
            </Text>
          </View>
        )}

        {/* About dropdown */}
        <TouchableOpacity
          style={[styles.iconTextRow, { marginTop: 8 }]}
          onPress={() => {
            setExpandedAbout(!expandedAbout);
            handleAboutApp();
          }}
          accessibilityRole="button"
          accessibilityLabel="Abrir Sobre o Aplicativo"
          accessibilityState={{ expanded: expandedAbout }}
        >
          <Image
            source={Info}
            style={styles.smallIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de informação"
          />
          <Text style={styles.subText}>Sobre o Aplicativo</Text>
        </TouchableOpacity>

        {expandedAbout && (
          <View style={{ paddingLeft: 40, paddingTop: 8, paddingBottom: 8 }}>
            <Text style={[styles.subText, { fontSize: 13, opacity: 0.9 }]}>LUMI — Aplicativo de Apoio</Text>
            <Text style={[styles.subText, { fontSize: 12, opacity: 0.8, marginTop: 6 }]}>Versão: 1.0.0</Text>
            <Text style={[styles.subText, { fontSize: 12, opacity: 0.8, marginTop: 4 }]}>Build: main</Text>
            <Text style={[styles.subText, { fontSize: 12, opacity: 0.8, marginTop: 8 }]}>Desenvolvido pela equipe Consciencia Espacial.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}