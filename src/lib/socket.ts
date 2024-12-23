import { io, Socket } from 'socket.io-client';
import { logger } from './logger';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 secondi

  constructor() {
    logger.debug('Inizializzazione SocketService');
  }

  connect(userId?: string) {
    if (this.socket?.connected) {
      logger.debug('Socket già connesso');
      return;
    }

    logger.info('Tentativo di connessione socket', { userId });

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { userId },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    // Gestione eventi di connessione
    this.socket.on('connect', () => {
      logger.info('Socket connesso', { 
        socketId: this.socket?.id,
        userId 
      });
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      logger.error('Errore connessione socket', { 
        error,
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.warn('Raggiunto numero massimo tentativi di riconnessione');
        this.socket?.disconnect();
      }
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('Socket disconnesso', { reason });
    });

    // Gestione errori
    this.socket.on('error', (error) => {
      logger.error('Errore socket', { error });
    });
  }

  disconnect() {
    if (this.socket) {
      logger.info('Disconnessione socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      logger.warn('Tentativo di emit su socket non connesso', { event, data });
      return;
    }

    logger.debug('Socket emit', { event, data });
    this.socket.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      logger.warn('Tentativo di registrare listener su socket non inizializzato', { event });
      return;
    }

    logger.debug('Registrazione listener socket', { event });
    this.socket.on(event, (...args) => {
      logger.debug('Socket evento ricevuto', { event, args });
      callback(...args);
    });
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) {
      logger.warn('Tentativo di rimuovere listener da socket non inizializzato', { event });
      return;
    }

    logger.debug('Rimozione listener socket', { event });
    this.socket.off(event, callback);
  }

  // Utility per verificare lo stato della connessione
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Utility per ottenere l'ID del socket
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

export const socket = new SocketService();
