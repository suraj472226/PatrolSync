import { useState, useEffect, useCallback } from 'react';
import offlineService from '../services/offline.service';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Subscribe to offline service updates
    const unsubscribe = offlineService.subscribe(({ isOnline, isSyncing }) => {
      setIsOnline(isOnline);
      setIsSyncing(isSyncing);
    });

    // Get initial pending count
    updatePendingCount();

    return () => unsubscribe();
  }, []);

  const updatePendingCount = async () => {
    const count = await offlineService.getPendingCount();
    setPendingCount(count);
  };

  const syncNow = useCallback(async () => {
    await offlineService.syncQueue();
    await updatePendingCount();
  }, []);

  const queueRequest = useCallback(async (request) => {
    const id = await offlineService.queueRequest(request);
    await updatePendingCount();
    return id;
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow,
    queueRequest,
    offlineService,
  };
}

export default useOfflineSync;
