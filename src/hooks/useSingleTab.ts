import { useEffect, useState } from 'react';

const TAB_KEY = 'techvolt_active_tab';
const HEARTBEAT_INTERVAL = 1000;

export const useSingleTab = () => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const tabId = `${Date.now()}-${Math.random()}`;

    // Check if another tab is active
    const existing = localStorage.getItem(TAB_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      // If heartbeat is recent (within 3s), another tab is active
      if (Date.now() - parsed.heartbeat < 3000) {
        setBlocked(true);
        return;
      }
    }

    // Claim this tab
    const updateHeartbeat = () => {
      localStorage.setItem(TAB_KEY, JSON.stringify({ id: tabId, heartbeat: Date.now() }));
    };
    updateHeartbeat();

    const interval = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);

    // Listen for other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === TAB_KEY && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (parsed.id !== tabId) {
          setBlocked(true);
        }
      }
    };
    window.addEventListener('storage', onStorage);

    // Cleanup on unload
    const onUnload = () => {
      const current = localStorage.getItem(TAB_KEY);
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed.id === tabId) {
          localStorage.removeItem(TAB_KEY);
        }
      }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('beforeunload', onUnload);
      onUnload();
    };
  }, []);

  return blocked;
};
