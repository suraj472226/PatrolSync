import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../services/api';

const COUNTDOWN_SECONDS = 5;

export default function SOSScreen({ navigation }) {
  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [triggered, setTriggered] = useState(false);
  const [sosId, setSosId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const holdTimer = useRef(null);
  const countdownInterval = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get location on mount
  useEffect(() => {
    (async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();

    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  const startHold = () => {
    setIsHolding(true);
    setCountdown(COUNTDOWN_SECONDS);
    Vibration.vibrate(100);

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: COUNTDOWN_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    // Start countdown
    let count = COUNTDOWN_SECONDS;
    countdownInterval.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      Vibration.vibrate(50);

      if (count <= 0) {
        clearInterval(countdownInterval.current);
        triggerSOS();
      }
    }, 1000);
  };

  const endHold = () => {
    if (!triggered) {
      setIsHolding(false);
      setCountdown(COUNTDOWN_SECONDS);
      progressAnim.setValue(0);

      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    }
  };

  const triggerSOS = async () => {
    setTriggered(true);
    setLoading(true);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);

    try {
      const currentLocation = location || (await Location.getCurrentPositionAsync()).coords;

      const response = await api.post('/mobile/sos/trigger', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      });

      setSosId(response.data.id);
    } catch (error) {
      console.error('Error triggering SOS:', error);
      Alert.alert('Error', 'Failed to send SOS alert. Please call emergency services directly.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    if (sosId) {
      try {
        await api.post(`/mobile/sos/${sosId}/cancel`);
      } catch (error) {
        console.error('Error cancelling SOS:', error);
      }
    }
    navigation.goBack();
  };

  const interpolatedProgress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (triggered) {
    return (
      <View style={styles.triggeredContainer}>
        <View style={styles.triggeredContent}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle" size={80} color="#fff" />
          )}
          <Text style={styles.triggeredTitle}>
            {loading ? 'Sending Alert...' : 'SOS Triggered!'}
          </Text>
          <Text style={styles.triggeredText}>
            {loading
              ? 'Please wait...'
              : 'Help is on the way. Stay calm and remain where you are.'}
          </Text>

          {location && (
            <View style={styles.locationBox}>
              <Ionicons name="location" size={20} color="#fca5a5" />
              <Text style={styles.locationText}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.triggeredActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelSOS}>
            <Text style={styles.cancelButtonText}>Cancel SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.dismissButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="warning" size={40} color="#fca5a5" />
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <Text style={styles.headerText}>
          Press and hold the button below for {COUNTDOWN_SECONDS} seconds to trigger an emergency alert
        </Text>
      </View>

      {/* Location Display */}
      {location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={18} color="#fca5a5" />
          <Text style={styles.locationLabel}>Your Location</Text>
          <Text style={styles.locationCoords}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* SOS Button */}
      <View style={styles.buttonContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: isHolding ? 0 : 0.4,
            },
          ]}
        />

        <TouchableOpacity
          style={styles.sosButton}
          onPressIn={startHold}
          onPressOut={endHold}
          activeOpacity={1}
        >
          {isHolding && (
            <Animated.View
              style={[
                styles.progressOverlay,
                { height: interpolatedProgress },
              ]}
            />
          )}
          <View style={styles.sosContent}>
            <Ionicons
              name={isHolding ? 'hand-left' : 'alert-circle'}
              size={48}
              color="#fff"
            />
            <Text style={styles.sosText}>
              {isHolding ? countdown : 'HOLD'}
            </Text>
            <Text style={styles.sosSubtext}>
              {isHolding ? 'Keep holding...' : 'for SOS'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          <Ionicons name="information-circle" size={16} color="#fca5a5" />
          {' '}Release to cancel
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7f1d1d',
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
  },
  headerText: {
    fontSize: 15,
    color: '#fecaca',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  locationContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#fca5a5',
    marginTop: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ef4444',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#991b1b',
  },
  sosContent: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  sosSubtext: {
    fontSize: 14,
    color: '#fecaca',
    marginTop: 4,
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 14,
    color: '#fca5a5',
  },
  triggeredContainer: {
    flex: 1,
    backgroundColor: '#dc2626',
    justifyContent: 'space-between',
    padding: 24,
  },
  triggeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggeredTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 24,
  },
  triggeredText: {
    fontSize: 16,
    color: '#fecaca',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  triggeredActions: {
    gap: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  dismissButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
