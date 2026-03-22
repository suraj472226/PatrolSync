import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PatrolActions({ onScan, onChecklist, onIncident, checklistCount, isShiftActive }) {
  const actions = [
    {
      id: 'scan',
      label: 'Scan',
      sublabel: 'Checkpoint',
      icon: 'qr-code',
      color: '#3b82f6',
      onPress: onScan,
    },
    {
      id: 'checklist',
      label: 'Checklist',
      sublabel: checklistCount > 0 ? `${checklistCount} pending` : 'None',
      icon: 'clipboard',
      color: '#8b5cf6',
      badge: checklistCount,
      onPress: onChecklist,
    },
    {
      id: 'incident',
      label: 'Incident',
      sublabel: 'Report',
      icon: 'warning',
      color: '#f59e0b',
      onPress: onIncident,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patrol Actions</Text>
      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, !isShiftActive && styles.actionCardDisabled]}
            onPress={action.onPress}
            disabled={!isShiftActive}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={28} color={action.color} />
              {action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionSublabel}>{action.sublabel}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginTop: 12,
  },
  actionSublabel: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
});
