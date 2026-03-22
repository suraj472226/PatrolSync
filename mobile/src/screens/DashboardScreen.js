import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

// Import dashboard components
import OfficerInfoCard from '../components/dashboard/OfficerInfoCard';
import ShiftTimer from '../components/dashboard/ShiftTimer';
import StatusBar from '../components/dashboard/StatusBar';
import PatrolActions from '../components/dashboard/PatrolActions';
import RecentPatrolLogs from '../components/dashboard/RecentPatrolLogs';
import SOSButton from '../components/dashboard/SOSButton';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftElapsedSeconds, setShiftElapsedSeconds] = useState(0);
  const [locationStr, setLocationStr] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(100);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const response = await api.get('/mobile/dashboard');
      const data = response.data;

      setDashboardData(data);
      setIsShiftActive(data.active_shift !== null);
      if (data.active_shift) {
        setShiftElapsedSeconds(data.active_shift.elapsed_seconds || 0);
      } else {
        setShiftElapsedSeconds(0);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Fallback to basic info
      setDashboardData({
        officer: {
          id: 0,
          employee_id: 'Unknown',
          name: 'Officer',
          role: 'Field Officer',
          status: 'off_duty'
        },
        active_shift: null,
        status_indicators: {
          gps_status: 'inactive',
          sync_status: 'synced',
          battery_level: 100,
          pending_sync_count: 0
        },
        patrol_actions: [],
        recent_logs: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS tracking is mandatory for shifts. Please enable it in settings.');
      }
    })();
  }, []);

  // Load dashboard on mount
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Get battery level
  useEffect(() => {
    const getBatteryLevel = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100));
      } catch (error) {
        console.log('Battery level unavailable:', error);
        setBatteryLevel(100);
      }
    };

    getBatteryLevel();

    // Update battery level every 30 seconds
    const interval = setInterval(getBatteryLevel, 30000);

    // Listen for battery level changes
    const subscription = Battery.addBatteryLevelListener(({ batteryLevel: level }) => {
      setBatteryLevel(Math.round(level * 100));
    });

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, []);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  // Start shift handler
  const handleStartShift = async () => {
    setActionLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      setLocationStr(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`);

      await api.post('/patrol/shift/start', {
        start_latitude: lat,
        start_longitude: lon
      });

      setIsShiftActive(true);
      setShiftElapsedSeconds(0);  // Start from 0 when shift begins
      Alert.alert('Shift Started', 'Your GPS location has been recorded. Stay safe!');
      fetchDashboard();

    } catch (error) {
      if (error.response?.status === 400) {
        // Shift already active
        setIsShiftActive(true);
        Alert.alert('Session Restored', 'You are already on duty! UI synced with the server.');
        fetchDashboard();
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Could not start shift. Ensure GPS is on.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // End shift handler
  const handleEndShift = async () => {
    Alert.alert(
      'End Shift',
      'Are you sure you want to end your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

              await api.post('/patrol/shift/end', {
                end_latitude: location.coords.latitude,
                end_longitude: location.coords.longitude
              });

              setIsShiftActive(false);
              setShiftStartTime(null);
              Alert.alert('Shift Ended', 'Shift completed successfully. Great job.');
              fetchDashboard();

            } catch (error) {
              Alert.alert('Error', 'Could not end shift. Please try again.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Logout handler
  const handleLogout = async () => {
    if (isShiftActive) {
      Alert.alert('Action Required', 'Please end your shift before logging out.');
      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('access_token');
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  // Navigate to SOS
  const handleSOS = () => {
    navigation.navigate('SOS');
  };

  // Navigate to scan
  const handleScan = () => {
    navigation.navigate('QRScanner');
  };

  // Navigate to checklist
  const handleChecklist = () => {
    navigation.navigate('ChecklistList');
  };

  // Navigate to incident
  const handleIncident = () => {
    navigation.navigate('Incident');
  };

  // Navigate to activity
  const handleViewActivity = () => {
    navigation.navigate('Activity');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Command Center</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#71717a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Officer Info Card */}
        <OfficerInfoCard
          officer={{
            ...dashboardData?.officer,
            status: isShiftActive ? 'on_duty' : 'off_duty'
          }}
        />

        {/* Shift Timer */}
        <View style={styles.section}>
          <ShiftTimer
            elapsedSeconds={shiftElapsedSeconds}
            isActive={isShiftActive}
          />
        </View>

        {/* Status Bar */}
        <View style={styles.section}>
          <StatusBar
            gpsStatus={dashboardData?.status_indicators?.gps_status || 'active'}
            syncStatus={dashboardData?.status_indicators?.sync_status || 'synced'}
            batteryLevel={batteryLevel}
            pendingCount={dashboardData?.status_indicators?.pending_sync_count || 0}
          />
        </View>

        {/* Shift Start/End Button */}
        <View style={styles.section}>
          {!isShiftActive ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartShift}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={24} color="#fff" />
                  <Text style={styles.startButtonText}>Start Shift</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndShift}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={24} color="#fff" />
                  <Text style={styles.endButtonText}>End Shift</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Patrol Actions */}
        <View style={styles.section}>
          <PatrolActions
            onScan={handleScan}
            onChecklist={handleChecklist}
            onIncident={handleIncident}
            checklistCount={dashboardData?.patrol_actions?.find(a => a.type === 'checklist')?.count || 0}
            isShiftActive={isShiftActive}
          />
        </View>

        {/* SOS Button */}
        <SOSButton onPress={handleSOS} isActive={isShiftActive} />

        {/* Recent Activity */}
        <View style={styles.section}>
          <RecentPatrolLogs
            logs={dashboardData?.recent_logs || []}
            onViewAll={handleViewActivity}
          />
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181b',
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginTop: 16,
  },
  startButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
