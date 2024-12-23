export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  fotoProfilo?: string;
  genere: 'M' | 'F';
  ruolo: 'ADMIN' | 'BARBIERE' | 'CLIENTE';
  createdAt: string;
  updatedAt: string;
}