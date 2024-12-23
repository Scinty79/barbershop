import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/ui/image-upload';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-hot-toast';
import { notificationService } from '@/lib/notifications/notification-service';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BookingModal } from '@/components/BookingModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Bell,
  Calendar,
  Clock,
  Heart,
  Scissors,
  Loader2,
  User,
  CalendarDays,
  Trash2,
  X,
  Euro,
  Camera,
  Plus,
  LogOut,
  Trophy,
  Star,
  CalendarPlus,
  Gift,
  MessageSquare,
  TrendingUp,
  Tag
} from 'lucide-react';

interface Booking {
  id: string;
  dataOra: string;
  stato: string;
  servizi: {
    servizio: {
      nome: string;
      durata: number;
      prezzo: number;
    }
  }[];
  barbiere: {
    utente: {
      nome: string;
      cognome: string;
      fotoProfilo: string;
    }
  };
}

interface Service {
  id: string;
  nome: string;
  descrizione: string;
  prezzo: number;
  durata: number;
}

interface Barber {
  id: string;
  nome: string;
  cognome: string;
  fotoProfilo: string;
}

interface FavoriteService {
  serviceId: string;
  count: number;
  lastBooked: string;
  service: Service;
}

interface Promotion {
  id: string;
  titolo: string;
  descrizione: string;
  sconto: number;
  puntiNecessari: number;
  validoDal: string;
  validoAl: string;
  tipo: 'POINTS' | 'SEASONAL' | 'SPECIAL';
}

interface Review {
  id: string;
  bookingId: string;
  serviceId: string;
  barberId: string;
  rating: number;
  commento: string;
  dataCreazione: string;
  service: Service;
  barber: Barber;
}

export default function ClientDashboard() {
  const { user, logout, setAuthState, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]); // Inizializza come array vuoto
  const [services, setServices] = useState<Service[]>([]); // Inizializza come array vuoto
  const [reviews, setReviews] = useState<Review[]>([]); // Inizializza come array vuoto
  const [promotions, setPromotions] = useState<Promotion[]>([]); // Inizializza come array vuoto
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]); // Inizializza come array vuoto
  const [reviewableBookings, setReviewableBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<string | null>(null);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const welcomeToastShown = useRef(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lazy loading refs
  const [servicesRef, servicesInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [promotionsRef, promotionsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Effetto per pulire il timeout quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Effetto per il caricamento iniziale dei dati
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!user) return;

      console.log('Caricamento dati utente iniziato');
      try {
        setLoading(true);
        await fetchUserData();
        if (isMounted) {
          console.log('Caricamento dati utente completato');
          setDataLoaded(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Errore nel caricamento dati:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    notificationService.connect(user?.id);

    // Aggiungi listener per l'evento booking-created
    const handleBookingCreated = () => {
      console.log('Nuova prenotazione creata, aggiornamento dashboard...');
      loadData();
    };
    window.addEventListener('booking-created', handleBookingCreated);

    return () => {
      isMounted = false;
      notificationService.disconnect();
      // Rimuovi il listener quando il componente viene smontato
      window.removeEventListener('booking-created', handleBookingCreated);
    };
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [pointsRes, bookingsRes, servicesRes, reviewsRes, promotionsRes, favoriteServicesRes] = await Promise.all([
        api.get('/api/points/my'),
        api.get('/api/bookings/my'),
        api.get('/api/services'),
        api.get('/api/reviews/my'),
        api.get('/api/promotions'),
        api.get('/api/services/favorites')
      ]);

      // Formatta le date delle prenotazioni
      const formattedBookings = bookingsRes.data.data?.map(booking => ({
        ...booking,
        dataOra: booking.dataOra ? format(new Date(booking.dataOra), 'dd MMMM yyyy HH:mm', { locale: it }) : '',
      })) || [];

      setPoints(pointsRes.data.points || 0);
      setBookings(formattedBookings);
      setServices(servicesRes.data.data || []);
      setReviews(reviewsRes.data.data || []);
      setPromotions(promotionsRes.data.data || []);
      setFavoriteServices(favoriteServicesRes.data.data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel caricamento dei dati",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Effetto separato per gestire il toast di benvenuto
  useEffect(() => {
    // Se il toast è già stato mostrato in questa sessione, non mostrarlo di nuovo
    if (welcomeToastShown.current) {
      console.log('Toast già mostrato in questa sessione');
      return;
    }

    const showWelcomeToast = () => {
      const shouldShowWelcome = 
        location.state?.showWelcome === true && 
        !hasShownWelcome &&
        dataLoaded &&
        !loading &&
        user !== null;

      console.log('Controllo condizioni toast:', {
        hasState: location.state?.showWelcome === true,
        notShownYet: !hasShownWelcome,
        dataLoaded,
        notLoading: !loading,
        hasUser: user !== null,
        locationState: location.state,
        welcomeToastShown: welcomeToastShown.current
      });
      
      if (shouldShowWelcome) {
        console.log('Preparazione toast di benvenuto...');
        
        // Mostra il toast con un delay per assicurarsi che il componente sia montato
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        toastTimeoutRef.current = setTimeout(() => {
          console.log('Esecuzione toast di benvenuto...');
          toast({
            title: "Benvenuto!",
            description: `Accesso effettuato con successo`,
            duration: 3000,
          });
          
          welcomeToastShown.current = true;
          setHasShownWelcome(true);

          // Rimuovi lo state dalla location
          navigate(location.pathname, { 
            replace: true,
            state: {} 
          });

          console.log('Toast di benvenuto completato');
        }, 1000);
      }
    };

    // Esegui il check del toast immediatamente dopo il mount
    showWelcomeToast();
  }, [dataLoaded, loading, location.state, hasShownWelcome, user]);

  // Effetto per gestire le prenotazioni recensibili
  useEffect(() => {
    if (!Array.isArray(bookings) || !Array.isArray(reviews)) {
      return; // Esce se bookings o reviews non sono array
    }

    const reviewedBookingIds = new Set(reviews.map(review => review.bookingId));
    const reviewable = bookings.filter(
      booking => booking && booking.stato === 'COMPLETATA' && !reviewedBookingIds.has(booking.id)
    );
    setReviewableBookings(reviewable);
  }, [bookings, reviews]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/api/users/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Errore durante il caricamento della foto');
      }

      // Aggiorna i dati dell'utente usando la funzione updateUser
      updateUser(response.data.data);
      
      toast.success('Foto profilo aggiornata con successo');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Errore nel caricamento della foto');
    } finally {
      setIsUpdatingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Errore durante il logout');
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingToCancel) return;

    try {
      setIsLoading(true);
      const response = await api.delete(`/api/bookings/${selectedBookingToCancel}`);
      
      if (response.data.success) {
        toast({
          title: "Successo",
          description: "Prenotazione cancellata con successo",
          variant: "default",
        });
        
        // Rimuovi la prenotazione dalla lista
        setBookings(prev => prev.filter(b => b.id !== selectedBookingToCancel));
      } else {
        throw new Error(response.data.message || 'Errore durante la cancellazione');
      }
    } catch (error: any) {
      console.error('Error canceling booking:', error);
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore durante la cancellazione della prenotazione",
        variant: "destructive",
      });
    } finally {
      // Chiudi il dialog e resetta lo stato
      setShowCancelDialog(false);
      setSelectedBookingToCancel(null);
      setIsLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (serviceId: string) => {
    try {
      setIsLoading(true);
      const response = await api.delete(`/api/services/favorites/${serviceId}`);
      
      if (response.data.success) {
        setFavoriteServices(prev => prev.filter(s => s.serviceId !== serviceId));
        toast({
          title: "Successo",
          description: "Servizio rimosso dai preferiti",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Errore durante la rimozione del servizio dai preferiti:', error);
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Impossibile rimuovere il servizio dai preferiti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToFavorites = async (serviceId: string) => {
    try {
      setIsLoading(true);
      const response = await api.post(`/api/services/favorites/${serviceId}`);
      
      if (response.data.success) {
        setFavoriteServices(prev => [...prev, response.data.data]);
        toast({
          title: "Successo",
          description: "Servizio aggiunto ai preferiti",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Errore durante l\'aggiunta del servizio ai preferiti:', error);
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Impossibile aggiungere il servizio ai preferiti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton circle width={56} height={56} />
            <div>
              <Skeleton width={200} height={24} />
              <Skeleton width={150} height={20} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton width={100} height={40} />
            <Skeleton width={150} height={40} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton height={200} />
            <Skeleton height={400} />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton height={300} />
            <Skeleton height={200} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section with Profile and Actions */}
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          {/* Profile Image Section */}
          <div className="relative group">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            <Avatar 
              className="h-14 w-14 ring-2 ring-amber-500/20 ring-offset-2 ring-offset-zinc-900 transition-all duration-200 ease-out cursor-pointer group-hover:ring-amber-500/40"
              onClick={() => fileInputRef.current?.click()}
            >
              <AvatarImage 
                src={user?.fotoProfilo ? `${import.meta.env.VITE_API_URL}/uploads/${user.fotoProfilo}` : undefined} 
                alt={`${user?.nome} ${user?.cognome}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xl">
                {user?.nome?.[0]}{user?.cognome?.[0]}
              </AvatarFallback>
              
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </Avatar>
            
            {isUpdatingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">
              {user?.genere === 'F' ? 'Benvenuta' : 'Benvenuto'}, {user?.nome}!
            </h1>
            <p className="text-zinc-400">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            
            <Button 
              onClick={() => setShowBookingModal(true)}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuova Prenotazione
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-zinc-400 hover:text-zinc-100"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Prenotazioni Card */}
          <Card className="border border-zinc-800/50 hover:border-amber-500/20 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-amber-500/10 p-3 rounded-lg group-hover:bg-amber-500/20 transition-colors duration-300">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-amber-500">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-zinc-100">{bookings.length}</p>
                <p className="text-sm text-zinc-400 mt-1">Prenotazioni Attive</p>
              </div>
            </CardContent>
          </Card>

          {/* Punti Card */}
          <Card className="border border-zinc-800/50 hover:border-amber-500/20 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-purple-500/10 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors duration-300">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-0">
                  Livello {Math.floor(points / 100) + 1}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-zinc-100">{points}</p>
                <p className="text-sm text-zinc-400 mt-1">Punti Fedeltà</p>
              </div>
            </CardContent>
          </Card>

          {/* Recensioni Card */}
          <Card className="border border-zinc-800/50 hover:border-amber-500/20 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-emerald-500/10 p-3 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <Star className="h-6 w-6 text-emerald-500" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                  {reviews.length}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-zinc-100">{reviews.length}</p>
                <p className="text-sm text-zinc-400 mt-1">Recensioni Lasciate</p>
              </div>
            </CardContent>
          </Card>

          {/* Servizi Preferiti Card */}
          <Card className="border border-zinc-800/50 hover:border-amber-500/20 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-rose-500/10 p-3 rounded-lg group-hover:bg-rose-500/20 transition-colors duration-300">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
                <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-0">
                  Top {favoriteServices.length}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-zinc-100">{favoriteServices.length}</p>
                <p className="text-sm text-zinc-400 mt-1">Servizi Preferiti</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prenotazioni
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Servizi
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promozioni
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recensioni
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Prenotazioni */}
          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  Prenotazioni Attive
                </CardTitle>
                <CardDescription>
                  Gestisci le tue prenotazioni attive
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 border border-zinc-800/50 hover:border-amber-500/20"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Avatar className="h-12 w-12 border-2 border-amber-500/10">
                            <AvatarImage 
                              src={booking.barbiere.utente.fotoProfilo ? `${import.meta.env.VITE_API_URL}/uploads/${booking.barbiere.utente.fotoProfilo}` : undefined} 
                              alt={`${booking.barbiere.utente.nome} ${booking.barbiere.utente.cognome}`} 
                            />
                            <AvatarFallback className="bg-zinc-700">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-zinc-100">
                              {booking.barbiere.utente.nome} {booking.barbiere.utente.cognome}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mt-1">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4 text-amber-500" />
                                {booking.dataOra}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-amber-500" />
                                {booking.dataOra}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto sm:ml-auto">
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {booking.servizi.map((s, index) => (
                              <span 
                                key={index} 
                                className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full text-sm"
                              >
                                <Scissors className="h-3 w-3" />
                                {s.servizio.nome}
                              </span>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-auto sm:ml-0"
                            onClick={() => {
                              setSelectedBookingToCancel(booking.id);
                              setShowCancelDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                    <p>Non hai prenotazioni attive</p>
                    <Button 
                      variant="link" 
                      className="mt-2 text-amber-500 hover:text-amber-400"
                      onClick={() => setShowBookingModal(true)}
                    >
                      Prenota il tuo primo appuntamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Servizi */}
          <TabsContent value="services" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tutti i Servizi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-amber-500" />
                    Tutti i Servizi
                  </CardTitle>
                  <CardDescription>
                    Sfoglia i servizi disponibili
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {services.map((service) => {
                    const isFavorite = favoriteServices.some(
                      (fav) => fav.serviceId === service.id
                    );
                    
                    return (
                      <div
                        key={service.id}
                        className="group p-4 rounded-lg border border-zinc-800 hover:border-amber-500/50 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-zinc-100">
                            {service.nome}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "flex-shrink-0 -mt-1 -mr-2",
                              isFavorite ? "text-amber-500 hover:text-amber-600" : "text-zinc-400 hover:text-zinc-300"
                            )}
                            onClick={() => isFavorite 
                              ? handleRemoveFromFavorites(service.id)
                              : handleAddToFavorites(service.id)
                            }
                            disabled={isLoading}
                          >
                            <Heart 
                              className={cn(
                                "h-4 w-4 transition-all duration-300",
                                isFavorite && "fill-current"
                              )} 
                            />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex items-center text-zinc-400">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {service.durata} min
                          </span>
                          <span className="flex items-center text-amber-500 ml-auto">
                            <Euro className="h-3.5 w-3.5 mr-1" />
                            {Number(service.prezzo).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Servizi Preferiti */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-amber-500" />
                    I Tuoi Preferiti
                  </CardTitle>
                  <CardDescription>
                    Servizi salvati per prenotazioni veloci
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoriteServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Heart className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                      <p className="text-zinc-500 dark:text-zinc-400">
                        Non hai ancora servizi preferiti
                      </p>
                      <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                        Aggiungi i servizi che usi più spesso ai preferiti
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {favoriteServices.map((service) => (
                        <div 
                          key={service.serviceId}
                          className="group p-4 rounded-lg border border-zinc-800 hover:border-amber-500/50 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-zinc-100">
                              {service.service.nome}
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-amber-500 hover:text-amber-600 -mt-1 -mr-2"
                              onClick={() => handleRemoveFromFavorites(service.serviceId)}
                              disabled={isLoading}
                            >
                              <Heart className="h-4 w-4 fill-current" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center text-zinc-400">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {service.service.durata} min
                            </span>
                            <span className="flex items-center text-amber-500 ml-auto">
                              <Euro className="h-3.5 w-3.5 mr-1" />
                              {Number(service.service.prezzo).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Promozioni */}
          <TabsContent value="promotions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-amber-500" />
                  Promozioni Attive
                </CardTitle>
                <CardDescription>
                  Scopri le offerte disponibili per te
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : promotions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {promotions.map((promotion) => (
                      <div 
                        key={promotion.id}
                        className="p-6 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-amber-500/20 hover:bg-zinc-800/50 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1.5">
                            <h3 className="font-medium text-lg text-zinc-100">
                              {promotion.titolo}
                            </h3>
                            <p className="text-sm text-zinc-400">
                              {promotion.descrizione}
                            </p>
                          </div>
                          <Badge variant={promotion.tipo === 'POINTS' ? 'default' : 'secondary'} className="text-base px-3 py-1">
                            {promotion.sconto}% OFF
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50">
                          {promotion.puntiNecessari > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-amber-500/10 p-2 rounded">
                                <Trophy className="w-4 h-4 text-amber-500" />
                              </div>
                              <span className="text-zinc-400">{promotion.puntiNecessari} punti necessari</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm ml-auto">
                            <div className="bg-zinc-800/50 p-2 rounded">
                              <Calendar className="w-4 h-4 text-zinc-400" />
                            </div>
                            <span className="text-zinc-500">
                              Valido fino al {new Date(promotion.validoAl).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                    <p>Nessuna promozione attiva</p>
                    <p className="text-sm mt-2">Torna a trovarci per nuove offerte!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Recensioni */}
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  Le tue Recensioni
                </CardTitle>
                <CardDescription>
                  Gestisci le tue recensioni
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Non hai ancora lasciato recensioni
                    </p>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                      Le tue recensioni appariranno qui dopo aver completato un servizio
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                      <div 
                        key={review.id}
                        className="p-6 bg-zinc-900/50 rounded-lg border border-zinc-800/50"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-zinc-100">
                              {review.service.nome}
                            </h4>
                            <p className="text-sm text-zinc-400 mt-1">
                              {review.commento}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating ? "text-amber-500 fill-current" : "text-zinc-600"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-zinc-400">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {review.barber.nome} {review.barber.cognome}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(review.dataCreazione), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lascia una recensione</DialogTitle>
            <DialogDescription>
              La tua opinione è importante per noi e ci aiuta a migliorare il servizio
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>Servizio</Label>
                <p className="text-sm text-zinc-400">
                  {selectedBooking.servizi[0]?.servizio.nome}
                </p>
              </div>
              <div>
                <Label>Barbiere</Label>
                <p className="text-sm text-zinc-400">
                  {`${selectedBooking.barbiere.utente.nome} ${selectedBooking.barbiere.utente.cognome}`}
                </p>
              </div>
              <div>
                <Label>Valutazione</Label>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant={value <= rating ? "default" : "outline"}
                      size="icon"
                      onClick={() => setRating(value)}
                    >
                      <Star className={value <= rating ? "fill-current" : ""} size={16} />
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Commento</Label>
                <Textarea
                  placeholder="Scrivi qui il tuo commento..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewModal(false);
                    setRating(5);
                    setComment('');
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setIsSubmittingReview(true);
                      await api.post('/api/reviews', {
                        bookingId: selectedBooking.id,
                        barberId: selectedBooking.barbiere.id,
                        serviceId: selectedBooking.servizi[0].servizio.id,
                        rating,
                        comment
                      });
                      
                      toast.success('Recensione inviata con successo!');
                      setShowReviewModal(false);
                      setRating(5);
                      setComment('');
                      
                      // Ricarica le recensioni
                      const { data } = await api.get('/api/reviews/my');
                      setReviews(data);
                    } catch (error) {
                      console.error('Error submitting review:', error);
                      toast.error('Errore durante l\'invio della recensione');
                    } finally {
                      setIsSubmittingReview(false);
                    }
                  }}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    'Invia Recensione'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BookingModal 
        showModal={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
      />
      
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-zinc-800 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Cancella prenotazione</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Sei sicuro di voler cancellare questa prenotazione? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isLoading}
              onClick={() => {
                setShowCancelDialog(false);
                setSelectedBookingToCancel(null);
              }}
            >
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              disabled={isLoading}
              onClick={handleCancelBooking}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancellazione...
                </>
              ) : (
                'Conferma Cancellazione'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
