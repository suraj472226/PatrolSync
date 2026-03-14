import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QRScannerScreen from './src/screens/QRScannerScreen';

// Import our screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import IncidentScreen from './src/screens/IncidentScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} // Hide the top header on the login screen
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: 'Command Center', headerBackVisible: false }} // Prevent swiping back to login
        />
        <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen} 
            options={{ title: 'Scan Checkpoint', presentation: 'modal' }} 
        />
        <Stack.Screen 
            name="Incident" 
            component={IncidentScreen} 
            options={{ title: 'Report Incident', presentation: 'modal' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}