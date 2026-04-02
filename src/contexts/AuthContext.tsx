import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SESSION_TIMEOUT_MS = 60 * 1000; // 1 minute inactivity

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionTimeLeft: number;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT_MS / 1000);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivity = useRef<number>(Date.now());
  const isSigningOut = useRef(false);

  const closeSession = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('user_sessions')
        .update({ logout_time: new Date().toISOString(), is_active: false })
        .eq('user_id', userId)
        .is('logout_time', null);
    } catch (error) {
      console.error('Session close error:', error);
    }
  }, []);

  const performSignOut = useCallback(async (reason?: string) => {
    if (isSigningOut.current) return;
    isSigningOut.current = true;
    
    try {
      const currentUser = user;
      if (currentUser) {
        await closeSession(currentUser.id);
      }
      await supabase.auth.signOut();
      if (reason) {
        setTimeout(() => {
          alert(reason);
        }, 100);
      }
    } finally {
      isSigningOut.current = false;
    }
  }, [user, closeSession]);

  // Inactivity timeout management
  const resetInactivityTimer = useCallback(() => {
    lastActivity.current = Date.now();
    setSessionTimeLeft(SESSION_TIMEOUT_MS / 1000);

    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    
    if (user) {
      inactivityTimer.current = setTimeout(() => {
        performSignOut('Session expired due to inactivity (1 minute). Please log in again.');
      }, SESSION_TIMEOUT_MS);
    }
  }, [user, performSignOut]);

  // Countdown timer
  useEffect(() => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    
    if (user) {
      countdownInterval.current = setInterval(() => {
        const elapsed = Date.now() - lastActivity.current;
        const remaining = Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - elapsed) / 1000));
        setSessionTimeLeft(remaining);
      }, 1000);
    } else {
      setSessionTimeLeft(SESSION_TIMEOUT_MS / 1000);
    }

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [user]);

  // Listen for user activity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handler = () => resetInactivityTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            trackSession(session.user.id, 'login');
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const trackSession = async (userId: string, action: 'login' | 'logout') => {
    try {
      if (action === 'login') {
        await supabase.from('user_sessions').insert({
          user_id: userId,
          login_time: new Date().toISOString(),
          user_agent: navigator.userAgent,
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });

    if (!error && data.user) {
      const hashedRef = btoa(email + Date.now().toString());
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        email,
        encrypted_password_hash: hashedRef,
      });

      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'user',
      });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error: error as Error | null };
    }

    if (data.user) {
      const { data: activeSessions } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('is_active', true);

      if (activeSessions && activeSessions.length > 0) {
        await supabase.auth.signOut();
        return {
          error: new Error('This account is already logged in on another device/window. Please log out from the other session first.') as Error,
        };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await performSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionTimeLeft, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
