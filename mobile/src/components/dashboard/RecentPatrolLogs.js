import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RecentPatrolLogs({ logs, onViewAll }) {
  const getIconByType = (type) => {
    switch (type) {
      case 'patrol': return 'checkmark-circle';
      case 'checklist': return 'clipboard';
      case 'incident': return 'warning';
      case 'sos': return 'alert-circle';
      default: return 'ellipse';
    }
  };

  const getColorByType = (type) => {
    switch (type) {
      case 'patrol': return '#22c55e';
      case 'checklist': return '#8b5cf6';
      case 'incident': return '#f59e0b';
      case 'sos': return '#ef4444';
      default: return '#a1a1aa';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (logs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#d4d4d8" />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const color = getColorByType(item.type);

    return (
      <View style={styles.logItem}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={getIconByType(item.type)} size={18} color={color} />
        </View>
        <View style={styles.logContent}>
          <Text style={styles.logTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? '#22c55e' : '#f59e0b' }]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
    marginLeft: 12,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
  },
  logTime: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f4f4f5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 12,
  },
});
