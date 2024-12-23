import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog } from '@/components/ui/dialog';
import { Clock, User, LogIn } from 'lucide-react';
import { StarIcon } from '@heroicons/react/24/solid';
import AuthModals from '@/components/AuthModals';
import { BookingModal } from '@/components/BookingModal';
import { Navigation } from '@/components/Navigation';
import { Reviews } from '@/components/reviews';
import { motion } from 'framer-motion';
import { ServicesSection } from './components/services-section';
import { ScrollToTop } from './components/scroll-to-top';
import { useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';

export default function App() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'reset-password' | null>(null);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Gestisce l'apertura automatica del modal di login quando richiesto
  useEffect(() => {
    if (location.state?.showLoginModal) {
      setAuthModal('login');
      // Pulisci lo state per evitare che il modal si riapra dopo la chiusura
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Reindirizza alla dashboard appropriata se l'utente è già autenticato
  useEffect(() => {
    if (isAuthenticated && user && location.pathname === '/') {
      // Verifica se stiamo arrivando da un logout
      if (!location.state?.fromLogout) {
        const dashboardPath = user.ruolo === 'ADMIN' ? '/admin/dashboard' : '/client-dashboard';
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleBookingClick = () => {
    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Per prenotare un appuntamento devi prima accedere o registrarti",
        duration: 5000,
      });
      setAuthModal('login');
    } else {
      setShowBookingModal(true);
    }
  };

  const handleAuthClick = (type: 'login' | 'register' | 'reset-password') => {
    setAuthModal(type);
  };

  const handleAuthModalClose = () => {
    setAuthModal(null);
  };

  // Se l'utente è autenticato, non mostrare la landing page
  if (isAuthenticated && user) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navigation onAuthClick={handleAuthClick} />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2940')] 
                       bg-cover bg-center bg-no-repeat"
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />
          </div>

          {/* Content */}
          <motion.div
            className="container mx-auto px-4 relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Barbershop
              </h1>
              <p className="text-xl md:text-2xl text-zinc-200 mb-8 max-w-2xl mx-auto">
                Prenota il tuo appuntamento oggi stesso e affidati alle mani esperte dei nostri barbieri professionisti.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleBookingClick}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Prenota Ora
                </Button>
                {!user && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-black"
                    onClick={() => setAuthModal('login')}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Accedi
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Services Section */}
        <ServicesSection />

        {/* Reviews Section */}
        <Reviews />

        {/* Modals */}
        <AuthModals
          showModal={authModal}
          onClose={handleAuthModalClose}
          onChangeModal={handleAuthClick}
        />

        <BookingModal
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
        />

        {/* Scroll to Top Button */}
        <ScrollToTop />

        {/* Toast Container */}
        <Toaster />
      </main>
    </div>
  );
}