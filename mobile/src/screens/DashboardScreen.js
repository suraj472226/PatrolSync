import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationStr, setLocationStr] = useState('Location not captured yet');

  // Verify permissions when the dashboard loads
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS tracking is mandatory for shifts. Please enable it in settings.');
      }
    })();
  }, []);

  const handleStartShift = async () => {
    setIsLoading(true);
    try {
      // 1. Grab the exact GPS coordinates
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      
      setLocationStr(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`);

      // 2. Send the shift start punch to FastAPI
      await api.post('/patrol/shift/start', {
        start_latitude: lat,
        start_longitude: lon
      });

      setIsShiftActive(true);
      Alert.alert('Shift Started', 'Your GPS location has been recorded. Stay safe!');

    } catch (error) {
      // --- THE SELF-HEALING FIX ---
      if (error.response?.status === 400) {
        console.log("Backend says shift is already active! Syncing UI...");
        setIsShiftActive(true); // Force the UI to show ON DUTY
        Alert.alert('Session Restored', 'You are already on duty! UI synced with the server.');
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Could not start shift. Ensure GPS is on.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShift = async () => {
    setIsLoading(true);
    try {
      // 1. Grab final GPS coordinates
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      // 2. Send the shift end punch to FastAPI
      await api.post('/patrol/shift/end', {
        end_latitude: location.coords.latitude,
        end_longitude: location.coords.longitude
      });

      setIsShiftActive(false);
      Alert.alert('Shift Ended', 'Shift completed successfully. Great job.');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not end shift. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isShiftActive) {
      Alert.alert('Action Required', 'Please end your shift before logging out.');
      return;
    }
    await SecureStore.deleteItemAsync('access_token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Command Center</Text>
        <Text style={styles.statusText}>
          Status: {isShiftActive ? <Text style={styles.active}>🟢 ON DUTY</Text> : <Text style={styles.inactive}>🔴 OFF DUTY</Text>}
        </Text>
        <Text style={styles.locationText}>Last GPS: {locationStr}</Text>
      </View>

      <View style={styles.actionContainer}>
        {!isShiftActive ? (
          <TouchableOpacity style={[styles.mainButton, styles.startButton]} onPress={handleStartShift} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>Start Shift</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={[styles.mainButton, styles.scanButton]} onPress={() => navigation.navigate('QRScanner')}>
              <Text style={styles.mainButtonText}>📷 Scan Checkpoint</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.mainButton, styles.incidentButton]} onPress={() => navigation.navigate('Incident')}>
              <Text style={styles.mainButtonText}>⚠️ Report Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.mainButton, styles.endButton]} onPress={handleEndShift} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>End Shift</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 20 },
  headerCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3, marginTop: 40, marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#18181b', marginBottom: 10 },
  statusText: { fontSize: 18, fontWeight: '600' },
  active: { color: '#16a34a' },
  inactive: { color: '#dc2626' },
  locationText: { fontSize: 12, color: '#71717a', marginTop: 10 },
  actionContainer: { flex: 1, justifyContent: 'center', gap: 15 },
  mainButton: { padding: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  startButton: { backgroundColor: '#16a34a' },
  endButton: { backgroundColor: '#dc2626', marginTop: 20 },
  scanButton: { backgroundColor: '#2563eb' },
  incidentButton: { backgroundColor: '#ea580c' },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { padding: 15, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: '#71717a', fontSize: 16, fontWeight: '600' }
});