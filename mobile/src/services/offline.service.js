import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const QUEUE_KEY = '@offline_queue';
const MAX_RETRY_ATTEMPTS = 3;

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.isSyncing = false;
    this.listeners = [];

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      // If we just came back online, trigger sync
      if (wasOffline && this.isOnline) {
        this.syncQueue();
      }

      this.notifyListeners();
    });
  }

  // Subscribe to status changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach((listener) => {
      listener({
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
      });
    });
  }

  // Get current queue
  async getQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  // Save queue
  async saveQueue(queue) {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  // Add item to queue
  async queueRequest(request) {
    const queue = await this.getQueue();
    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...request,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(queueItem);
    await this.saveQueue(queue);
    return queueItem.id;
  }

  // Remove item from queue
  async removeFromQueue(id) {
    const queue = await this.getQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await this.saveQueue(filtered);
  }

  // Get pending count
  async getPendingCount() {
    const queue = await this.getQueue();
    return queue.length;
  }

  // Process queue
  async syncQueue() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.notifyListeners();

    const queue = await this.getQueue();
    const remainingQueue = [];

    for (const item of queue) {
      try {
        // Execute the request
        await this.executeRequest(item);
        console.log(`Synced queued request: ${item.type}`);
      } catch (error) {
        console.error(`Failed to sync request: ${item.type}`, error);

        // Increment attempt counter
        item.attempts += 1;

        // Keep in queue if under max attempts
        if (item.attempts < MAX_RETRY_ATTEMPTS) {
          remainingQueue.push(item);
        } else {
          console.log(`Dropping request after ${MAX_RETRY_ATTEMPTS} failed attempts:`, item);
        }
      }
    }

    await this.saveQueue(remainingQueue);
    this.isSyncing = false;
    this.notifyListeners();
  }

  // Execute a queued request
  async executeRequest(item) {
    const { method, url, data } = item;

    switch (method.toLowerCase()) {
      case 'post':
        return api.post(url, data);
      case 'patch':
        return api.patch(url, data);
      case 'put':
        return api.put(url, data);
      case 'delete':
        return api.delete(url);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // Smart request with offline fallback
  async request(method, url, data, options = {}) {
    const { queueIfOffline = true, type = 'generic' } = options;

    // If online, try direct request
    if (this.isOnline) {
      try {
        const response = await api[method.toLowerCase()](url, data);
        return { success: true, data: response.data, queued: false };
      } catch (error) {
        // If network error and queueing enabled, queue it
        if (queueIfOffline && error.message === 'Network Error') {
          const queueId = await this.queueRequest({ method, url, data, type });
          return { success: true, queued: true, queueId };
        }
        throw error;
      }
    }

    // If offline and queueing enabled
    if (queueIfOffline) {
      const queueId = await this.queueRequest({ method, url, data, type });
      return { success: true, queued: true, queueId };
    }

    throw new Error('No network connection');
  }

  // Clear all queued items
  async clearQueue() {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }
}

export const offlineService = new OfflineService();
export default offlineService;
