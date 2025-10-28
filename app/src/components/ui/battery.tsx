import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

type BatteryProps = {
  percent: number; // 0 - 100
  width?: number; // total width of the battery body (excluding terminal)
  height?: number; // height of the battery body
};

export function Battery({ percent, width = 28, height = 16 }: BatteryProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const fillWidth = Math.max(0, (width - 5.5) * (100 / 100));

  const fillColor =
    safePercent > 65 ? '#4CAF50' : safePercent > 35 ? '#FFD54F' : '#F44336';

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.body, { width, height }]}>
        <View style={styles.innerTrack}>
          <View
            style={[
              styles.fill,
              { width: fillWidth, backgroundColor: fillColor, height: height - 4 },
            ]}
          />
        </View>
      </View>

      {/* terminal */}
      <View style={[styles.terminal, { height: Math.max(4, height / 2) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    padding: 2,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  innerTrack: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  fill: {
    borderRadius: 2,
    marginLeft: -1.5,
  },
  terminal: {
    width: 3,
    marginLeft: 3,
    backgroundColor: '#888',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});

export default Battery;
