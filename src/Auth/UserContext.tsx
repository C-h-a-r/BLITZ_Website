// UserContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './client'; // Your Supabase client initialization
import { User } from '@supabase/supabase-js';

// Define types for the context state
interface UserContextType {
  user: User | null;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Listen for changes in authentication state
  useEffect(() => {
    // Fetch the session asynchronously
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        setUser(null);
      } else {
        setUser(data?.session?.user ?? null);
      }
    };

    // Call the function to get the session when the component mounts
    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
        }
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook to use the user context
export const useUser = (): UserContextType => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
