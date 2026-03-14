import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import api from '../services/api';

export default function IncidentScreen({ navigation }) {
  const [category, setCategory] = useState('Security');
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['Security', 'Maintenance', 'Medical'];

  const submitIncident = async (selectedCategory = category, isSOS = false) => {
      setIsLoading(true);
      try {
        // 1. Grab the exact location of the incident
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        
        // 2. Conditionally send to the correct FastAPI endpoint
        if (isSOS) {
          // Hit the dedicated SOS endpoint
          await api.post('/incident/sos', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        } else {
          // Hit the standard Report endpoint
          await api.post('/incident/report', {
            site_id: 1, 
            category: selectedCategory,
            remarks: remarks,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            photo_url: "" 
          });
        }

        Alert.alert(
          isSOS ? '🚨 SOS Sent!' : '✅ Report Submitted', 
          isSOS ? 'Help is on the way. Stay safe.' : 'The incident has been logged successfully.', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );

      } catch (error) {
        console.error("Backend Error:", error.response?.data || error.message);
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.headerText}>Report an Observation</Text>

      {/* Category Selection */}
      <Text style={styles.label}>Select Category</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat} 
            style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Remarks Input */}
      <Text style={styles.label}>Remarks / Details</Text>
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={4}
        placeholder="Describe what happened..."
        value={remarks}
        onChangeText={setRemarks}
      />

      {/* Standard Submit Button */}
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={() => submitIncident(category, false)}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* THE SOS BUTTON */}
      <Text style={styles.sosWarning}>For immediate danger only</Text>
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={() => submitIncident('EMERGENCY_SOS', true)}
        disabled={isLoading}
      >
        <Text style={styles.sosText}>🚨 TRIGGER SOS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 20 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#18181b', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#3f3f46', marginBottom: 10, marginTop: 10 },
  categoryContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  categoryButton: { flex: 1, paddingVertical: 10, backgroundColor: '#e4e4e7', borderRadius: 8, alignItems: 'center' },
  categoryButtonActive: { backgroundColor: '#2563eb' },
  categoryText: { color: '#52525b', fontWeight: '600' },
  categoryTextActive: { color: '#ffffff' },
  textInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 8, padding: 15, fontSize: 16, height: 100, textAlignVertical: 'top', marginBottom: 30 },
  submitButton: { backgroundColor: '#16a34a', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  submitText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#d4d4d8', marginBottom: 30 },
  sosWarning: { textAlign: 'center', color: '#71717a', marginBottom: 10 },
  sosButton: { backgroundColor: '#dc2626', padding: 20, borderRadius: 12, alignItems: 'center', elevation: 5, marginBottom: 40 },
  sosText: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 2 }
});