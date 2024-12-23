import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Mostra un loader mentre verifichiamo l'autenticazione
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Se l'utente non è autenticato, reindirizza alla home con il state per aprire il modal di login
  if (!isAuthenticated || !user) {
    // Preveniamo un loop infinito se siamo già sulla home
    if (location.pathname === '/') {
      return <>{children}</>;
    }
    return <Navigate to="/" state={{ showLoginModal: true, from: location.pathname }} replace />;
  }

  // Se ci sono ruoli specificati e l'utente non ha il ruolo corretto
  if (allowedRoles && !allowedRoles.includes(user.ruolo)) {
    // Reindirizza alla dashboard appropriata in base al ruolo
    const dashboardPath = user.ruolo === 'ADMIN' ? '/admin/dashboard' : '/client-dashboard';
    // Preveniamo un loop infinito se siamo già sulla dashboard corretta
    if (location.pathname === dashboardPath) {
      return <>{children}</>;
    }
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
