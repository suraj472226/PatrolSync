import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import api from '../services/api';

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera access to scan checkpoints.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true); 
    
    if (!data.startsWith('SITE_ID:')) {
      Alert.alert('Invalid QR Code', 'This is not a valid PatrolSync checkpoint.', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
      return;
    }

    const siteId = data.split(':')[1];

    try {
      // Grab current GPS to prove we are physically at the QR code
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      // FIX 1: Changed 'QR_CODE' to 'QR Code' to match the backend Enum exactly
      await api.post('/patrol/log', {
        site_id: parseInt(siteId),
        scan_type: 'QR Code', 
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      Alert.alert('✅ Checkpoint Verified', `Successfully logged patrol at Site ${siteId}.`, [
        { text: 'Back to Dashboard', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.log("Validation Error:", JSON.stringify(error.response?.data, null, 2));
      Alert.alert('Error', 'Failed to log checkpoint. Check terminal for details.', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* FIX 2: CameraView is now a sibling, not a parent wrapper */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Overlay sits completely on top of the camera using absoluteFillObject */}
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
        <Text style={styles.scanText}>Point camera at the Checkpoint QR Code</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#000' },
  message: { textAlign: 'center', color: '#fff', fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, marginHorizontal: 40, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Notice the absoluteFillObject here that layers it perfectly over the camera
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#16a34a', backgroundColor: 'transparent', marginBottom: 30 },
  scanText: { color: '#fff', fontSize: 16, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8 },
  cancelButton: { position: 'absolute', bottom: 50, backgroundColor: '#dc2626', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  cancelText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});