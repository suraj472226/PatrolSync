import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SOSButton({ onPress, isActive }) {
  return (
    <TouchableOpacity
      style={[styles.container, !isActive && styles.disabled]}
      onPress={onPress}
      disabled={!isActive}
      activeOpacity={0.8}
    >
      <View style={styles.button}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={styles.buttonText}>SOS</Text>
      </View>
      <Text style={styles.hint}>Hold for emergency</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  hint: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 8,
  },
});
