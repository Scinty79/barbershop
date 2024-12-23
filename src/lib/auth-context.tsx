import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { User } from '@/types/auth';
import { auth } from './auth';

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inizializza lo stato di autenticazione dal localStorage
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const savedAuth = localStorage.getItem('auth');
      const parsedAuth = savedAuth ? JSON.parse(savedAuth) : { user: null, token: null };
      console.log('Auth state inizializzato:', parsedAuth);
      return parsedAuth;
    } catch (error) {
      console.error('Errore nel recupero dello stato di autenticazione:', error);
      return { user: null, token: null };
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Calcola isAuthenticated in base alla presenza di user e token
  const isAuthenticated = Boolean(authState.user && authState.token);

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => {
      const updatedState = {
        ...prev,
        user: prev.user ? { ...prev.user, ...userData } : null
      };
      localStorage.setItem('auth', JSON.stringify(updatedState));
      console.log('Auth state aggiornato:', updatedState);
      return updatedState;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await auth.login({ email, password });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Errore durante il login');
      }

      const { user, token } = response.data;
      
      // Aggiorna lo stato
      const newAuthState = { user, token };
      setAuthState(newAuthState);
      
      // Salva in localStorage
      localStorage.setItem('auth', JSON.stringify(newAuthState));
      localStorage.setItem('token', token);
      
      console.log('Login effettuato con successo:', newAuthState);
      return { user, token };
    } catch (error) {
      console.error('Errore durante il login:', error);
      setAuthState({ user: null, token: null });
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Pulisci lo stato di autenticazione
      setAuthState({ user: null, token: null });
      
      // Rimuovi i dati dal localStorage
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      
      console.log('Logout effettuato con successo');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  }, []);

  const value = {
    user: authState.user,
    token: authState.token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
}
