import { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { useToast } from './ui/use-toast';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingNotification {
  id: string;
  customerName: string;
  date: string;
  time: string;
  services: Array<{
    nome: string;
    prezzo: number;
  }>;
  totalAmount: number;
}

export function RealtimeNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    logger.debug('Inizializzazione listener notifiche real-time');

    const handleNewBooking = (data: { barberId: string; booking: BookingNotification }) => {
      logger.info('Ricevuta nuova notifica prenotazione', {
        bookingId: data.booking.id,
        barberId: data.barberId
      });

      // Crea il contenuto della notifica
      const NotificationContent = () => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-2"
        >
          <p className="font-medium">
            Nuova prenotazione da {data.booking.customerName}
          </p>
          <div className="text-sm space-y-1 text-zinc-400">
            <p>📅 {format(new Date(data.booking.date), 'dd MMMM yyyy', { locale: it })}</p>
            <p>🕒 {data.booking.time}</p>
            <p>✂️ {data.booking.services.map(s => s.nome).join(', ')}</p>
            <p className="font-medium text-amber-500">
              💰 €{data.booking.totalAmount.toFixed(2)}
            </p>
          </div>
        </motion.div>
      );

      // Mostra la notifica toast
      toast({
        title: "Nuova Prenotazione",
        description: <NotificationContent />,
        duration: 5000,
      });

      // Riproduci un suono di notifica
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(error => {
        logger.warn('Impossibile riprodurre il suono di notifica', { error });
      });

      // Aggiorna il badge del browser se la pagina è in background
      if (document.hidden) {
        const currentTitle = document.title;
        document.title = '(1) Nuova prenotazione - Barbershop';
        
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            document.title = currentTitle;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    };

    // Registra il listener per le nuove prenotazioni
    socket.on('new-booking', handleNewBooking);

    // Gestione errori socket
    socket.on('connect_error', (error) => {
      logger.error('Errore connessione socket', { error });
      toast({
        title: "Errore Connessione",
        description: "Impossibile ricevere notifiche in tempo reale",
        variant: "destructive",
      });
    });

    return () => {
      logger.debug('Pulizia listener notifiche real-time');
      socket.off('new-booking', handleNewBooking);
    };
  }, [toast]);

  // Questo componente non renderizza nulla direttamente
  return null;
}
