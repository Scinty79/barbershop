import { api } from './api';
import { API_BASE_URL } from '@/config/api';

interface LoginData {
  email: string;
  password: string;
}

// Funzione per impostare il token JWT negli header di axios
const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const auth = {
  login: async (data: LoginData) => {
    console.log('Tentativo di login con:', data);
    console.log('URL chiamata:', `${API_BASE_URL}/api/auth/login`);
    try {
      const response = await api.post('/api/auth/login', data);
      console.log('Risposta server:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('auth', JSON.stringify({
          user: response.data.data.user,
          token: response.data.data.token
        }));
        setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Errore dettagliato:', error.response || error);
      const errorMessage = error.response?.data?.error || error.message || 'Errore durante il login';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  register: async (formData: FormData) => {
    try {
      const response = await api.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('auth', JSON.stringify({
          user: response.data.data.user,
          token: response.data.data.token
        }));
        setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Errore durante la registrazione',
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    setAuthToken(null);
  },

  me: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Errore durante il recupero del profilo',
      };
    }
  },

  resetPassword: async (email: string) => {
    try {
      const response = await api.post('/api/auth/reset-password', { email });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Errore durante il reset della password',
      };
    }
  },

  setAuthToken // Esporto la nuova funzione
};