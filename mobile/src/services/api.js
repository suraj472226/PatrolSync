import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 🛑 REPLACE THIS WITH YOUR COMPUTER'S ACTUAL WI-FI IPv4 ADDRESS
const BASE_URL = 'http://10.112.194.132:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;