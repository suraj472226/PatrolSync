import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatusBar({ gpsStatus, syncStatus, batteryLevel, pendingCount }) {
  const getGpsColor = () => {
    switch (gpsStatus) {
      case 'active': return '#22c55e';
      case 'inactive': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#a1a1aa';
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'synced': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#a1a1aa';
    }
  };

  const getBatteryIcon = () => {
    if (batteryLevel > 75) return 'battery-full';
    if (batteryLevel > 50) return 'battery-half';
    if (batteryLevel > 25) return 'battery-half';
    return 'battery-dead';
  };

  const getBatteryColor = () => {
    if (batteryLevel > 25) return '#22c55e';
    if (batteryLevel > 10) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusItem}>
        <Ionicons name="location" size={18} color={getGpsColor()} />
        <Text style={[styles.statusText, { color: getGpsColor() }]}>
          GPS {gpsStatus === 'active' ? 'Active' : gpsStatus === 'inactive' ? 'Inactive' : 'Error'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusItem}>
        <Ionicons name="sync" size={18} color={getSyncColor()} />
        <Text style={[styles.statusText, { color: getSyncColor() }]}>
          {syncStatus === 'synced' ? 'Synced' : syncStatus === 'pending' ? `${pendingCount || 0} Pending` : 'Offline'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusItem}>
        <Ionicons name={getBatteryIcon()} size={18} color={getBatteryColor()} />
        <Text style={[styles.statusText, { color: getBatteryColor() }]}>
          {batteryLevel || 0}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#e4e4e7',
  },
});
