import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !otp) {
      Alert.alert('Error', 'Please enter both ID and OTP.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get the unique hardware ID for Device Binding
      // If we are on an emulator, we'll generate a fallback string
    //   const deviceId = Device.osBuildId || Device.modelId || "emulator-test-device-01";
        const deviceId = (Device.osBuildId || Device.modelId || "test-device") + "-" + identifier;

      // 2. Call the FastAPI Login Endpoint
      const response = await api.post('/auth/login', {
        identifier: identifier,
        password: otp, // In our backend, password handles the OTP logic
        device_id: deviceId
      });

      // 3. Securely store the token and user info
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('user_role', response.data.user.role);
      await SecureStore.setItemAsync('user_id', response.data.user.id.toString());

      Alert.alert('Success', 'Welcome to PatrolSync');
      
      // 4. Navigate to the Dashboard (We will build this next!)
      navigation.replace('Dashboard'); 

    } catch (error) {
      console.error(error);
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PatrolSync</Text>
        <Text style={styles.subtitle}>Field Officer Access</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Employee ID / Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. EMP101"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />

        <Text style={styles.label}>OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Secure Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#18181b' },
  subtitle: { fontSize: 16, color: '#71717a', marginTop: 5 },
  form: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { fontSize: 14, fontWeight: '600', color: '#3f3f46', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});