import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import IncidentScreen from './src/screens/IncidentScreen';
import ChecklistListScreen from './src/screens/ChecklistListScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import SOSScreen from './src/screens/SOSScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator Component (Main app after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Scan':
              iconName = focused ? 'qr-code' : 'qr-code-outline';
              break;
            case 'Activity':
              iconName = focused ? 'list' : 'list-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e4e4e7',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#18181b',
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Scan"
        component={QRScannerScreen}
        options={{
          title: 'Scan Checkpoint',
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'Activity',
          tabBarLabel: 'Activity',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: '700',
            color: '#18181b',
          },
          headerTintColor: '#3b82f6',
          headerShadowVisible: false,
        }}
      >
        {/* Auth Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Main App (Tab Navigator) */}
        <Stack.Screen
          name="Dashboard"
          component={MainTabs}
          options={{
            headerShown: false,
            headerBackVisible: false,
          }}
        />

        {/* Modal Screens */}
        <Stack.Screen
          name="Incident"
          component={IncidentScreen}
          options={{
            title: 'Report Incident',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="ChecklistList"
          component={ChecklistListScreen}
          options={{
            title: 'Checklists',
            presentation: 'card',
          }}
        />

        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={({ route }) => ({
            title: route.params?.title || 'Checklist',
            presentation: 'card',
          })}
        />

        <Stack.Screen
          name="SOS"
          component={SOSScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />

        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            title: 'Scan Checkpoint',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name="ReportDetail"
          component={ReportDetailScreen}
          options={({ route }) => ({
            title: route.params?.title || 'Report Details',
            presentation: 'card',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
