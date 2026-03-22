import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function ChecklistListScreen({ navigation }) {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChecklists = async () => {
    try {
      const response = await api.get('/mobile/checklists/assigned');
      setChecklists(response.data);
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChecklists();
  };

  const handleChecklistPress = (checklist) => {
    navigation.navigate('Checklist', {
      checklistId: checklist.id,
      title: checklist.title,
      responseId: checklist.draft_response_id,
    });
  };

  const renderChecklistCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleChecklistPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, item.has_draft && styles.iconContainerDraft]}>
          <Ionicons
            name={item.has_draft ? 'document-text' : 'clipboard-outline'}
            size={24}
            color={item.has_draft ? '#f59e0b' : '#3b82f6'}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.industry && (
            <Text style={styles.cardIndustry}>{item.industry}</Text>
          )}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={14} color="#71717a" />
              <Text style={styles.metaText}>{item.question_count} questions</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
      </View>

      {item.has_draft && (
        <View style={styles.draftBanner}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.draft_progress}%` }]} />
          </View>
          <Text style={styles.draftText}>
            {item.draft_progress}% complete - Continue where you left off
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>No Checklists Available</Text>
      <Text style={styles.emptyText}>
        Checklists assigned to your site will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading checklists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={checklists}
        renderItem={renderChecklistCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#71717a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDraft: {
    backgroundColor: '#fef3c7',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 4,
  },
  cardIndustry: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#71717a',
  },
  draftBanner: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#fcd34d',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#fde68a',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  draftText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#52525b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
