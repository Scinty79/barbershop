import axios from 'axios';

// In Next.js, le API routes sono disponibili direttamente sotto /api
// Non c'è bisogno di specificare un baseURL completo
const instance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Aggiungi interceptor per gestire gli errori
instance.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error.response || error);
    return Promise.reject(error);
  }
);

export default instance;
