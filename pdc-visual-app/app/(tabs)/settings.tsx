import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { styles } from './styles';
import { useApp } from '@/contexts/AppContext';
import { BluetoothService, BluetoothDevice } from '@/services/bluetooth-service';

const LogoImage = require('@/assets/images/logo.png');
const Increase = require('@/assets/images/increase.png');
const Decrease = require('@/assets/images/decrease.png');
const SoundImage = require('@/assets/images/sound.png');
const Info = require('@/assets/images/warning.png');
const Devices = require('@/assets/images/devices.png');

export default function SettingsScreen() {
  const { volume, setVolume, setSystemVolume, showToast, wsConnected, connectWebSocket } = useApp();
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bluetoothService] = useState(() => new BluetoothService());

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
    console.log('Ajuda e FAQ pressionado');
  };

  const handleAboutApp = () => {
    console.log('Sobre o Aplicativo pressionado');
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
              accessibilityLabel={wsConnected ? 'Servidor online' : 'Servidor offline'}
            >
              {wsConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {!wsConnected && (
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
              bluetoothDevices.map((device) => (
                <View key={device.id} style={styles.rowBetween}>
                  <Text
                    style={styles.subText}
                    accessibilityLabel={device.name}
                  >
                    - {device.name}
                  </Text>
                  <View
                    style={[
                      styles.deviceTag,
                      device.connected ? styles.deviceTagConnected : styles.deviceTagDisconnected
                    ]}
                  >
                    <Text
                      style={styles.deviceTagText}
                      accessibilityLabel={device.connected ? 'Conectado' : 'Desconectado'}
                    >
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
              <Text style={styles.buttonText}>🔄 Atualizar Dispositivos</Text>
            </TouchableOpacity>
          </>
        )}
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
          <Text style={styles.subText}>Sobre o Aplicativo          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}