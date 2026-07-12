import { useState, useEffect, createContext, useContext } from 'react';
import { API_BASE_URL } from '../config';

interface BackendWarmupContextType {
  isBackendReady: boolean;
}

const BackendWarmupContext = createContext<BackendWarmupContextType>({ isBackendReady: false });

export const useBackendWarmup = () => {
  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryInterval: ReturnType<typeof setInterval> | null = null;

    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (res.ok && !cancelled) {
          setIsBackendReady(true);
          if (retryInterval) clearInterval(retryInterval);
          return true;
        }
      } catch {
        // Backend still waking up
      }
      return false;
    };

    // Immediately ping
    ping().then((ready) => {
      if (!ready && !cancelled) {
        // Retry every 3 seconds
        retryInterval = setInterval(async () => {
          const success = await ping();
          if (success || cancelled) {
            if (retryInterval) clearInterval(retryInterval);
          }
        }, 3000);
      }
    });

    return () => {
      cancelled = true;
      if (retryInterval) clearInterval(retryInterval);
    };
  }, []);

  return { isBackendReady };
};

export const BackendWarmupProvider = BackendWarmupContext.Provider;
export const useBackendReady = () => useContext(BackendWarmupContext);
