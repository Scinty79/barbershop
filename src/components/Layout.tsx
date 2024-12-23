import { useAuth } from '@/lib/auth-context';
import { RealtimeNotifications } from './RealtimeNotifications';
import { Toaster } from './ui/toaster';
import { logger } from '@/lib/logger';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  logger.debug('Layout renderizzato', { 
    userId: user?.id,
    userRole: user?.ruolo 
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Mostra RealtimeNotifications solo per i barbieri */}
      {user?.ruolo === 'BARBIERE' && <RealtimeNotifications />}
      
      {/* Contenuto principale */}
      <main>
        {children}
      </main>

      {/* Sistema di notifiche toast */}
      <Toaster />
    </div>
  );
}
