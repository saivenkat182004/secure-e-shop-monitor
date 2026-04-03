import React, { useEffect, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

const SessionTimer = () => {
  const { user, session, signOut } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Listen for user activity
  useEffect(() => {
    if (!user) return;
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetActivity));
    };
  }, [user, resetActivity]);

  // Timer tick every second
  useEffect(() => {
    if (!user || !session) return;
    const loginTime = new Date(session.expires_at ? (session.expires_at * 1000 - 3600000) : Date.now()).getTime();
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));

      // Check inactivity
      if (now - lastActivity >= INACTIVITY_TIMEOUT) {
        clearInterval(interval);
        signOut();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, session, lastActivity, signOut]);

  if (!user) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeUntilTimeout = Math.max(0, Math.floor((INACTIVITY_TIMEOUT - (Date.now() - lastActivity)) / 1000));
  const timeoutMin = Math.floor(timeUntilTimeout / 60);
  const timeoutSec = timeUntilTimeout % 60;
  const isWarning = timeUntilTimeout <= 120; // warn at 2 min

  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock className="w-3.5 h-3.5 text-primary" />
      <span className="text-muted-foreground">
        Session: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <span className={`font-mono ${isWarning ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
        (Idle: {String(timeoutMin).padStart(2, '0')}:{String(timeoutSec).padStart(2, '0')})
      </span>
    </div>
  );
};

export default SessionTimer;
