import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'pending', label: 'Pending' },
];

export default function ActivityScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  const fetchActivities = async (reset = false) => {
    const currentOffset = reset ? 0 : offset;

    try {
      const params = new URLSearchParams({
        offset: currentOffset.toString(),
        limit: LIMIT.toString(),
      });

      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await api.get(`/mobile/activity?${params.toString()}`);
      const data = response.data;

      if (reset) {
        setActivities(data.items);
        setOffset(LIMIT);
      } else {
        setActivities((prev) => [...prev, ...data.items]);
        setOffset((prev) => prev + LIMIT);
      }

      setHasMore(data.items.length === LIMIT && currentOffset + LIMIT < data.total);

    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetchActivities(true);
  }, [activeTab]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (!loading) {
        setOffset(0);
        fetchActivities(true);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    fetchActivities(true);
  }, [activeTab, searchQuery]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchActivities(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const colors = {
      completed: { bg: '#dcfce7', text: '#16a34a' },
      submitted: { bg: '#dcfce7', text: '#16a34a' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      in_progress: { bg: '#dbeafe', text: '#2563eb' },
      overdue: { bg: '#fef2f2', text: '#dc2626' },
      triggered: { bg: '#fef2f2', text: '#dc2626' },
      resolved: { bg: '#dcfce7', text: '#16a34a' },
      cancelled: { bg: '#f4f4f5', text: '#71717a' },
    };
    return colors[status] || { bg: '#f4f4f5', text: '#71717a' };
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleActivityPress = (item) => {
    navigation.navigate('ReportDetail', {
      type: item.type,
      id: item.id,
      title: item.title,
    });
  };

  const renderActivityItem = ({ item }) => {
    const statusStyle = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: getColorByType(item.type) + '20' }]}>
          <Ionicons name={getIconByType(item.type)} size={22} color={getColorByType(item.type)} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.summary && (
            <Text style={styles.cardSummary} numberOfLines={1}>{item.summary}</Text>
          )}
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color="#a1a1aa" />
            <Text style={styles.cardTime}>{formatDate(item.timestamp)}</Text>
            {item.location && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Ionicons name="location-outline" size={12} color="#a1a1aa" />
                <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#d4d4d8" />
      <Text style={styles.emptyTitle}>No Activity Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Your patrol activity will appear here'}
      </Text>
    </View>
  );

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#a1a1aa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activity..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#a1a1aa"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={<ListFooter />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#18181b',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181b',
  },
  cardSummary: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  cardTime: {
    fontSize: 11,
    color: '#a1a1aa',
  },
  metaDivider: {
    color: '#d4d4d8',
    marginHorizontal: 2,
  },
  cardLocation: {
    fontSize: 11,
    color: '#a1a1aa',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
