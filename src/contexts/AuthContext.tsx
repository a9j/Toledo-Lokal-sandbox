import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'resident' | 'business' | 'admin' | 'organizer' | 'nonprofit' | 'partner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  isNonprofit: boolean;
  isPartner: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRoles = (userId: string) => {
    setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (!error && data) {
          setRoles(data.map(r => r.role as AppRole));
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    }, 0);
  };

  useEffect(() => {
    let mounted = true;

    // First, get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRoles(session.user.id);
        }
        setIsLoading(false);
      }
    });

    // Then set up the listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        // Only update if there's an actual change
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          fetchUserRoles(newSession.user.id);
        } else {
          setRoles([]);
        }

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name: name || email }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isBusiness = hasRole('business');
  const isNonprofit = hasRole('nonprofit');
  const isPartner = hasRole('partner');
  const isOrganizer = hasRole('organizer');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      roles,
      isLoading,
      signUp,
      signIn,
      signOut,
      hasRole,
      isAdmin,
      isBusiness,
      isNonprofit,
      isPartner,
      isOrganizer
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
