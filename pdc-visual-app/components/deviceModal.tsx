import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Device } from 'react-native-ble-plx';

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  onClose: () => void;
  onDevicePress: (device: Device) => Promise<void> |void;
};

const DeviceListItem = ({
  device,
  onPress,
}: {
  device: Device;
  onPress: (device: Device) => void;
}) => {
  return (
    <Pressable style={styles.deviceItem} onPress={() => onPress(device)}>
      <Text style={styles.deviceText}>{device.name || device.id}</Text>
    </Pressable>
  );
};

export const DeviceModal: React.FC<DeviceModalProps> = ({
  devices,
  visible,
  onClose,
  onDevicePress,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Scanned Devices</Text>

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DeviceListItem device={item} onPress={onDevicePress} />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No devices found yet...</Text>
            }
          />

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  deviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});