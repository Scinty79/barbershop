import { useState, useEffect } from 'react';
import AuthModals from '@/components/AuthModals';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  // Se l'utente è già autenticato, reindirizza alla dashboard appropriata
  useEffect(() => {
    if (user) {
      const dashboardPath = user.ruolo === 'ADMIN' ? '/admin/dashboard' : '/client-dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [user, navigate]);

  // Rimuovo il reindirizzamento alla home page
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <AuthModals 
          open={isOpen} 
          defaultModal="login" 
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
