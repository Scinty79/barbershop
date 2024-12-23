import { jwtVerify, SignJWT } from 'jose';
import { api } from '../api';

const JWT_SECRET = new TextEncoder().encode(import.meta.env.VITE_JWT_SECRET);

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  telefono: string;
  genere: 'M' | 'F';
  fotoProfilo?: string;
  ruolo: 'ADMIN' | 'CLIENTE' | 'BARBIERE';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthService {
  private refreshTokenTimeout?: NodeJS.Timeout;

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    this.startRefreshTokenTimer(response.data.token);
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh-token');
    this.startRefreshTokenTimer(response.data.token);
    return response.data;
  }

  async logout() {
    await api.post('/auth/logout');
    this.stopRefreshTokenTimer();
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await jwtVerify(token, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }

  private startRefreshTokenTimer(token: string) {
    this.stopRefreshTokenTimer();
    
    // Decodifica il token per ottenere l'exp
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const expires = new Date(decodedToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000); // Rinnova 1 minuto prima della scadenza
    
    this.refreshTokenTimeout = setTimeout(() => this.refreshToken(), timeout);
  }

  private stopRefreshTokenTimer() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }
}

export const authService = new AuthService();
