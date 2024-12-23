import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from "@/components/ui/use-toast";

interface Notification {
  id: string;
  tipo: 'PRENOTAZIONE' | 'PUNTI' | 'SISTEMA';
  messaggio: string;
  letta: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    // Aggiorna le notifiche ogni minuto
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsError(false);
      const response = await api.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter((n: Notification) => !n.letta).length);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle notifiche:', error);
      setIsError(true);
      toast({
        title: "Errore",
        description: "Impossibile caricare le notifiche",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, letta: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Errore nella marcatura della notifica come letta:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la notifica",
        variant: "destructive"
      });
    }
  };

  const deleteReadNotifications = async () => {
    try {
      await api.delete('/api/notifications/all');
      setNotifications(notifications.filter(n => !n.letta));
      toast({
        title: "Successo",
        description: "Notifiche lette eliminate",
      });
    } catch (error) {
      console.error('Errore nell\'eliminazione delle notifiche:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare le notifiche",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'PRENOTAZIONE':
        return '📅';
      case 'PUNTI':
        return '🎉';
      case 'SISTEMA':
        return '⚙️';
      default:
        return '📌';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative hover:bg-zinc-800"
        >
          <Bell className={`h-5 w-5 ${isError ? 'text-red-400' : 'text-zinc-400'} ${isLoading ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-80 bg-zinc-800 border-zinc-700"
      >
        {isLoading ? (
          <div className="py-6 px-4 text-center text-zinc-400">
            <Bell className="h-12 w-12 mx-auto mb-3 text-zinc-500 animate-pulse" />
            <p>Caricamento notifiche...</p>
          </div>
        ) : isError ? (
          <div className="py-6 px-4 text-center text-red-400">
            <Bell className="h-12 w-12 mx-auto mb-3 text-red-500" />
            <p>Errore nel caricamento</p>
            <Button 
              variant="ghost" 
              className="mt-2 text-sm hover:text-red-300"
              onClick={fetchNotifications}
            >
              Riprova
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 px-4 text-center text-zinc-400">
            <Bell className="h-12 w-12 mx-auto mb-3 text-zinc-500" />
            <p>Nessuna notifica</p>
          </div>
        ) : (
          <>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`px-4 py-3 focus:bg-zinc-700 cursor-pointer ${
                    !notification.letta ? 'bg-zinc-700/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.tipo)}</span>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.letta ? 'text-white' : 'text-zinc-300'}`}>
                        {notification.messaggio}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {format(new Date(notification.createdAt), 'dd MMMM, HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            {notifications.some(n => n.letta) && (
              <div className="p-2 border-t border-zinc-700">
                <Button
                  variant="ghost"
                  className="w-full text-sm text-zinc-400 hover:text-zinc-300"
                  onClick={deleteReadNotifications}
                >
                  Elimina notifiche lette
                </Button>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
