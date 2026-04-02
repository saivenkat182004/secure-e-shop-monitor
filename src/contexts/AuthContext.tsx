import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
          setTimeout(() => {
            if (user) {
              trackSession(user.id, 'logout');
            }
          }, 0);
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
      } else {
        await supabase
          .from('user_sessions')
          .update({ logout_time: new Date().toISOString(), is_active: false })
          .eq('user_id', userId)
          .is('logout_time', null);
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
      // Store profile with hashed password reference
      const hashedRef = btoa(email + Date.now().toString());
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        email,
        encrypted_password_hash: hashedRef,
      });

      // Assign default user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'user',
      });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
