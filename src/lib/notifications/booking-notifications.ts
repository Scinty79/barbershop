import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '../api';
import { socket } from '../socket';
import { logger } from '../logger';

interface BookingNotificationData {
  bookingId: string;
  userId: string;
  barberId: string;
  date: Date;
  time: string;
  services: Array<{
    nome: string;
    prezzo: number;
  }>;
  customerName: string;
  barberName: string;
  totalAmount: number;
}

interface NotificationResult {
  success: boolean;
  type: 'push' | 'customerEmail' | 'barberEmail' | 'realtime';
  error?: any;
}

export const BookingNotificationService = {
  async sendBookingNotifications(data: BookingNotificationData) {
    logger.info('Iniziando invio notifiche prenotazione', { bookingId: data.bookingId });
    
    const results: NotificationResult[] = [];
    
    // 1. Notifica push al barbiere
    try {
      logger.debug('Creazione notifica push per il barbiere', { barberId: data.barberId });
      await this.createBarberNotification(data);
      results.push({ success: true, type: 'push' });
    } catch (error) {
      logger.error('Errore durante invio notifica push', { error, bookingId: data.bookingId });
      results.push({ success: false, type: 'push', error });
    }

    // 2. Email al cliente
    try {
      logger.debug('Invio email di conferma al cliente', { userId: data.userId });
      await this.sendCustomerEmail(data);
      results.push({ success: true, type: 'customerEmail' });
    } catch (error) {
      logger.error('Errore durante invio email cliente', { error, bookingId: data.bookingId });
      results.push({ success: false, type: 'customerEmail', error });
    }

    // 3. Email al barbiere
    try {
      logger.debug('Invio email di notifica al barbiere', { barberId: data.barberId });
      await this.sendBarberEmail(data);
      results.push({ success: true, type: 'barberEmail' });
    } catch (error) {
      logger.error('Errore durante invio email barbiere', { error, bookingId: data.bookingId });
      results.push({ success: false, type: 'barberEmail', error });
    }

    // 4. Notifica real-time via WebSocket
    try {
      logger.debug('Invio notifica real-time', { barberId: data.barberId });
      this.sendRealtimeNotification(data);
      results.push({ success: true, type: 'realtime' });
    } catch (error) {
      logger.error('Errore durante invio notifica real-time', { error, bookingId: data.bookingId });
      results.push({ success: false, type: 'realtime', error });
    }

    const allSuccess = results.every(r => r.success);
    const failedNotifications = results.filter(r => !r.success);

    if (allSuccess) {
      logger.info('Tutte le notifiche inviate con successo', { bookingId: data.bookingId });
    } else {
      logger.warn('Alcune notifiche non sono state inviate', { 
        bookingId: data.bookingId,
        failedNotifications: failedNotifications.map(f => f.type)
      });
    }

    return {
      success: allSuccess,
      results
    };
  },

  async createBarberNotification(data: BookingNotificationData) {
    try {
      const response = await api.post('/api/notifications/create', {
        userId: data.barberId,
        tipo: 'PRENOTAZIONE',
        titolo: 'Nuova Prenotazione',
        messaggio: `Nuova prenotazione da ${data.customerName} per il ${format(data.date, 'dd MMMM yyyy', { locale: it })} alle ${data.time}`,
        data: format(data.date, 'yyyy-MM-dd'),
        ora: data.time,
        metadata: {
          bookingId: data.bookingId,
          services: data.services.map(s => s.nome).join(', '),
          totalAmount: data.totalAmount
        }
      });

      logger.debug('Notifica push creata con successo', { 
        notificationId: response.data.id,
        barberId: data.barberId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Errore creazione notifica push', { 
        error, 
        barberId: data.barberId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async sendCustomerEmail(data: BookingNotificationData) {
    try {
      const response = await api.post('/api/email/send', {
        to: data.userId,
        template: 'booking-confirmation',
        data: {
          customerName: data.customerName,
          date: format(data.date, 'dd MMMM yyyy', { locale: it }),
          time: data.time,
          barberName: data.barberName,
          services: data.services,
          totalAmount: data.totalAmount,
          bookingId: data.bookingId
        }
      });

      logger.debug('Email cliente inviata con successo', { 
        emailId: response.data.id,
        userId: data.userId 
      });

      return response.data;
    } catch (error) {
      logger.error('Errore invio email cliente', { 
        error, 
        userId: data.userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async sendBarberEmail(data: BookingNotificationData) {
    try {
      const response = await api.post('/api/email/send', {
        to: data.barberId,
        template: 'new-booking-notification',
        data: {
          customerName: data.customerName,
          date: format(data.date, 'dd MMMM yyyy', { locale: it }),
          time: data.time,
          services: data.services,
          totalAmount: data.totalAmount,
          bookingId: data.bookingId
        }
      });

      logger.debug('Email barbiere inviata con successo', { 
        emailId: response.data.id,
        barberId: data.barberId 
      });

      return response.data;
    } catch (error) {
      logger.error('Errore invio email barbiere', { 
        error, 
        barberId: data.barberId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  sendRealtimeNotification(data: BookingNotificationData) {
    try {
      socket.emit('new-booking', {
        barberId: data.barberId,
        booking: {
          id: data.bookingId,
          customerName: data.customerName,
          date: data.date,
          time: data.time,
          services: data.services,
          totalAmount: data.totalAmount
        }
      });

      logger.debug('Notifica real-time inviata', { 
        barberId: data.barberId,
        bookingId: data.bookingId 
      });
    } catch (error) {
      logger.error('Errore invio notifica real-time', { 
        error, 
        barberId: data.barberId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
};
