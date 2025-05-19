
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '@/lib/api';
import { toast } from 'sonner';

// Mock user for development until API is connected
const MOCK_USER: User = {
  id: '1',
  email: 'davidtorreslopez190924@gmail.com',
  name: 'David Torres',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For development: check if we should use mock data
const USE_MOCK_AUTH = true; // Set to false when real API is available

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        if (USE_MOCK_AUTH) {
          // Check localStorage for saved mock auth state
          const savedUser = localStorage.getItem('mock_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          setIsLoading(false);
          return;
        }

        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        // Mock login logic
        if (email === MOCK_USER.email && password === 'djfainali') {
          setUser(MOCK_USER);
          localStorage.setItem('mock_user', JSON.stringify(MOCK_USER));
          toast.success(`Welcome back, ${MOCK_USER.name || MOCK_USER.email}!`);
          return;
        } else {
          throw new Error("Invalid credentials");
        }
      }

      const userData = await apiLogin(email, password);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        localStorage.removeItem('mock_user');
        setUser(null);
        toast.success('You have been successfully logged out.');
        return;
      }

      await apiLogout();
      setUser(null);
      toast.success('You have been successfully logged out.');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
