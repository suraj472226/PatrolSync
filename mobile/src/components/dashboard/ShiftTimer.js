import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ShiftTimer({ elapsedSeconds, isActive }) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [localElapsed, setLocalElapsed] = useState(0);

  // Initialize with server's elapsed seconds
  useEffect(() => {
    if (!isActive) {
      setElapsedTime('00:00:00');
      setLocalElapsed(0);
      return;
    }

    // Use server's elapsed seconds as baseline (avoids timezone issues)
    setLocalElapsed(elapsedSeconds || 0);
  }, [elapsedSeconds, isActive]);

  // Update timer every second
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const updateTimer = () => {
      setLocalElapsed(prev => {
        const newElapsed = prev + 1;

        const hours = Math.floor(newElapsed / 3600);
        const minutes = Math.floor((newElapsed % 3600) / 60);
        const seconds = newElapsed % 60;

        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        setElapsedTime(formatted);

        return newElapsed;
      });
    };

    // Initial display
    const hours = Math.floor(localElapsed / 3600);
    const minutes = Math.floor((localElapsed % 3600) / 60);
    const seconds = localElapsed % 60;
    setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, localElapsed]);

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="time" size={24} color="#3b82f6" />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Shift Duration</Text>
        <Text style={styles.time}>{elapsedTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  label: {
    fontSize: 13,
    color: '#71717a',
    fontWeight: '500',
  },
  time: {
    fontSize: 32,
    fontWeight: '700',
    color: '#18181b',
    marginTop: 4,
  },
});
