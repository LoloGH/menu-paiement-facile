
import { useState, useEffect } from 'react';
import { supabase, isAdminUser } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AdminData {
  id: string;
  email: string;
  isAdmin: boolean;
}

export const useAdminAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          checkAdminStatus(newSession.user);
        } else {
          setAdminData(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        checkAdminStatus(currentSession.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (user: User) => {
    try {
      const admin = await isAdminUser(user.id);
      
      setIsAdmin(admin);
      setAdminData({
        id: user.id,
        email: user.email || '',
        isAdmin: admin
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    adminData,
    loading,
    isAdmin
  };
};
