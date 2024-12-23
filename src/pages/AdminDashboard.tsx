import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  Scissors, 
  Calendar,
  BarChart2,
  Download,
  Search,
  Plus,
  Trash,
  Edit as EditIcon,
  Star,
  Camera,
  Eye,
  EyeOff,
  Pencil,
  LogOut,
  Loader2, 
  TrendingUp, 
  Settings, 
  LayoutDashboard, 
  Filter, 
  Trash2, 
  AlertCircle,
  UserCircle2,
  ShieldCheck,
  CircleUserRound,
  Clock,
  CheckCircle2,
  XCircle,
  Euro
} from 'lucide-react';
import { api } from '@/lib/api';
import { ServiceDialog } from '@/components/ServiceDialog';
import BarbersManagement from '@/components/BarbersManagement';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from '@/components/ui/textarea';
import DeleteServiceDialog from '@/components/DeleteServiceDialog';
import { AddServiceModal } from '@/components/AddServiceModal';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: 'ADMIN' | 'BARBIERE' | 'CLIENTE';
  createdAt: string;
  fotoProfilo?: string;
  telefono?: string;
  genere: 'M' | 'F';
  online?: boolean;
  dataNascita?: string;
}

interface Booking {
  id: number;
  dataOra: string;
  stato: 'IN_ATTESA' | 'CONFERMATA' | 'COMPLETATA' | 'CANCELLATA';
  utente: {
    id: number;
    nome: string;
    cognome: string;
  };
  servizi: Array<{
    id: number;
    servizio: {
      id: number;
      nome: string;
      prezzo: number;
    };
  }>;
}

interface Service {
  id: string;
  nome: string;
  descrizione: string;
  prezzo: number;
  durata: number;
  categoria: string;
  punti?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  averageBookingsPerUser: number;
  todayBookings: number;
  activeServices: number;
  bookingTrends?: BookingTrend[];
  popularServices?: ServicePopularity[];
  timeSlotDistribution?: TimeSlotDistribution[];
}

interface EditedUser {
  nome?: string;
  cognome?: string;
  email?: string;
  password?: string;
  telefono?: string;
  ruolo?: 'ADMIN' | 'BARBIERE' | 'CLIENTE';
  genere?: 'M' | 'F';
  fotoProfilo?: File;
}

interface EditedBooking {
  data?: string;
  ora?: string;
  stato?: string;
  serviceId?: number;
}

interface EditedService {
  nome: string;
  descrizione: string;
  prezzo: string;  // Cambiato da number a string
  durata: string;  // Cambiato da number a string
  categoria: string;
}

interface BookingTrend {
  date: string;
  count: number;
}

interface ServicePopularity {
  serviceName: string;
  count: number;
}

interface TimeSlotDistribution {
  hour: string;
  count: number;
}

const TabIcon = ({ value }: { value: string }) => {
  const icons = {
    users: <Users className="h-4 w-4" />,
    services: <Scissors className="h-4 w-4" />,
    bookings: <Calendar className="h-4 w-4" />,
    analytics: <BarChart2 className="h-4 w-4" />,
    barbers: <Star className="h-4 w-4" />,
  };
  return icons[value as keyof typeof icons] || null;
};

const TabTitle = ({ value }: { value: string }) => {
  const titles = {
    users: "Utenti",
    services: "Servizi",
    bookings: "Prenotazioni",
    analytics: "Analisi Dati",
    barbers: "Barbieri",
  };
  return <span>{titles[value as keyof typeof titles]}</span>;
};

const getBadgeVariant = (stato: string) => {
  switch (stato) {
    case 'CONFERMATA':
      return 'success';
    case 'IN_ATTESA':
      return 'warning';
    case 'COMPLETATA':
      return 'default';
    case 'CANCELLATA':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getRoleBadgeVariant = (ruolo: string) => {
  switch (ruolo) {
    case 'ADMIN':
      return 'destructive';
    case 'BARBIERE':
      return 'success';
    case 'CLIENTE':
      return 'secondary';
    default:
      return 'default';
  }
};

const getRoleDisplayName = (ruolo: string) => {
  switch (ruolo) {
    case 'ADMIN':
      return 'Amministratore';
    case 'BARBIERE':
      return 'Barbiere';
    case 'CLIENTE':
      return 'Cliente';
    default:
      return ruolo;
  }
};

const getGenderDisplay = (genere?: string) => {
  console.log('Rendering genere:', {
    input: genere,
    tipo: typeof genere
  });
  
  switch(genere?.toUpperCase()) {
    case 'M':
      return 'Maschio';
    case 'F':
      return 'Femmina';
    default:
      return 'Non specificato';
  }
};

const calculateTotalBookingsAmount = (bookings: Booking[]): number => {
  return bookings.reduce((acc, booking) => {
    const bookingTotal = booking.servizi?.reduce((serviceAcc, service) => {
      return serviceAcc + (Number(service.servizio.prezzo) || 0);
    }, 0) || 0;
    return acc + bookingTotal;
  }, 0);
};

const BookingTrendsChart = ({ data }: { data: BookingTrend[] }) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Prenotazioni',
        data: data.map(item => item.count),
        borderColor: 'rgb(96, 165, 250)',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <>
      <h3 className="text-sm font-medium text-zinc-400 mb-2">Trend Prenotazioni</h3>
      <Line data={chartData} options={{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              maxRotation: 0,
              maxTicksLimit: 5,
              color: 'rgb(161, 161, 170)',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              maxTicksLimit: 5,
              color: 'rgb(161, 161, 170)',
            },
          },
        },
      }} />
    </>
  );
};

const PopularServicesChart = ({ data }: { data: ServicePopularity[] }) => {
  const chartData = {
    labels: data.map(item => item.serviceName),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(96, 165, 250, 0.7)',   // Blu
          'rgba(167, 139, 250, 0.7)',  // Viola
          'rgba(244, 114, 182, 0.7)',  // Rosa
          'rgba(251, 191, 36, 0.7)',   // Ambra
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <>
      <h3 className="text-sm font-medium text-zinc-400 mb-2">Servizi Più Richiesti</h3>
      <Pie data={chartData} options={{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              padding: 10,
              color: 'rgb(161, 161, 170)',
              font: {
                size: 11,
              },
            },
          },
        },
      }} />
    </>
  );
};

const TimeSlotChart = ({ data }: { data: TimeSlotDistribution[] }) => {
  const chartData = {
    labels: data.map(item => item.hour),
    datasets: [
      {
        label: 'Prenotazioni',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <>
      <h3 className="text-sm font-medium text-zinc-400 mb-2">Distribuzione Oraria</h3>
      <Bar data={chartData} options={{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgb(161, 161, 170)',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              maxTicksLimit: 5,
              color: 'rgb(161, 161, 170)',
            },
          },
        },
      }} />
    </>
  );
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingsPerUser: 0,
    todayBookings: 0,
    activeServices: 0
  });
  const [services, setServices] = useState<Service[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service>();
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editedUser, setEditedUser] = useState<EditedUser>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isDeleteBookingDialogOpen, setIsDeleteBookingDialogOpen] = useState(false);
  const [editedBooking, setEditedBooking] = useState<EditedBooking>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [editedService, setEditedService] = useState<EditedService>({
    nome: '',
    descrizione: '',
    durata: '30',
    prezzo: '0',
    categoria: ''
  });
  const [isDeleteServiceDialogOpen, setIsDeleteServiceDialogOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [barberInfo, setBarberInfo] = useState({
    specialita: [] as string[],  // Array di stringhe
    descrizione: '',
    orariLavoro: [
      { giorno: 1, oraInizio: '09:00', oraFine: '18:00' },  // Lunedì
      { giorno: 2, oraInizio: '09:00', oraFine: '18:00' },  // Martedì
      { giorno: 3, oraInizio: '09:00', oraFine: '18:00' },  // Mercoledì
      { giorno: 4, oraInizio: '09:00', oraFine: '18:00' },  // Giovedì
      { giorno: 5, oraInizio: '09:00', oraFine: '18:00' },  // Venerdì
    ]
  });
  const [userToConvert, setUserToConvert] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [avatarKey, setAvatarKey] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      console.log('Iniziando il recupero degli utenti...');
      const response = await api.get("/api/admin/users");
      
      if (response.data.success && Array.isArray(response.data.data)) {
        console.log("Dati utenti ricevuti dal server:", response.data.data);
        
        const formattedUsers = response.data.data.map((user: Partial<User>) => {
          // Log dettagliato dei dati utente ricevuti
          console.log('Dati grezzi utente:', {
            id: user.id,
            nome: user.nome,
            genere: user.genere,
            ruolo: user.ruolo
          });

          // Normalizza il genere solo se è presente
          const genere = user.genere?.toUpperCase();
          console.log(`Formattazione utente ${user.nome}:`, {
            nome: user.nome,
            cognome: user.cognome,
            genereOriginale: user.genere,
            genereNormalizzato: genere,
            genereFinale: genere === 'M' || genere === 'F' ? genere : 'M' // Default a M se non valido
          });
          
          return {
            ...user,
            // Usa il genere esistente se valido, altrimenti usa il default 'M'
            genere: (genere === 'M' || genere === 'F') ? genere : 'M'
          };
        });

        console.log('Utenti formattati:', formattedUsers);
        setUsers(formattedUsers);
      } else {
        console.error('Errore nel formato dei dati utente:', response.data.error);
        toast({
          title: 'Errore',
          description: 'Errore nel caricamento degli utenti',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Errore nel caricamento degli utenti:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (userData: any) => {
    try {
      setIsLoading(true);
      
      // Se stiamo cambiando il ruolo a BARBIERE
      if (userData.ruolo === 'BARBIERE' && selectedUser?.ruolo !== 'BARBIERE') {
        setUserToConvert({...selectedUser, ...userData});
        setIsEditModalOpen(false);
        setIsBarberModalOpen(true);
        return;
      }

      if (selectedUser) {
        const updateResponse = await api.put(`/api/users/${selectedUser.id}`, {
          nome: userData.nome,
          cognome: userData.cognome,
          email: userData.email,
          telefono: userData.telefono || '',
          ruolo: userData.ruolo,
          genere: userData.genere
        });

        if (updateResponse.data.success) {
          // Se stiamo cambiando da BARBIERE a un altro ruolo, elimina il record barbiere
          if (selectedUser.ruolo === 'BARBIERE' && userData.ruolo !== 'BARBIERE') {
            try {
              await api.delete(`/api/admin/barbers/${selectedUser.id}`);
            } catch (error) {
              console.error('Errore nella rimozione del barbiere:', error);
            }
          }

          if (selectedImage instanceof File) {
            const imageFormData = new FormData();
            imageFormData.append('photo', selectedImage);
            
            try {
              await api.post(`/api/admin/users/${selectedUser.id}/photo`, imageFormData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
            } catch (uploadError) {
              console.error('Errore upload immagine:', uploadError);
              toast({
                title: "Attenzione",
                description: "Utente aggiornato ma si è verificato un errore con l'immagine",
                variant: "destructive"
              });
            }
          }

          setIsEditModalOpen(false);
          setSelectedUser(null);
          setEditedUser({});
          setPreviewImage(null);
          setSelectedImage(null);

          await fetchUsers();

          toast({
            title: "Successo",
            description: "Utente aggiornato correttamente",
            variant: "success"
          });

          setTimeout(() => {
            setSearchQuery("");
            setRoleFilter("all");
          }, 100);
        }
      }
    } catch (error: any) {
      console.error("Errore nel salvare l'utente:", error);
      toast({
        title: "Errore",
        description: error.response?.data?.error || "Errore nel salvare l'utente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    console.log("Modifica utente:", user);
    setSelectedUser(user);
    setEditedUser({
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      telefono: user.telefono || '',
      ruolo: user.ruolo,
      genere: user.genere,
    });
    
    if (user.fotoProfilo) {
      setPreviewImage(`${import.meta.env.VITE_API_URL}/uploads/${user.fotoProfilo}`);
    } else {
      setPreviewImage(null);
    }
    
    setSelectedImage(null);
    setIsEditModalOpen(true);
  };

  const initializeNewUser = () => {
    setEditedUser({
      ruolo: 'CLIENTE',
      genere: 'M'
    });
  };

  useEffect(() => {
    if (user?.fotoProfilo) {
      setImageUrl(`/uploads/${user.fotoProfilo}`);
    }
  }, [user?.fotoProfilo]);

  useEffect(() => {
    if (!isEditModalOpen) {
      setEditedUser({});
      setShowPassword(false);
      setPreviewImage(null);
      setSelectedImage(null);
    } else if (!selectedUser) {
      initializeNewUser();
    }
  }, [isEditModalOpen, selectedUser]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selezionato:', file);

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Per favore seleziona un\'immagine valida',
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      console.log('Invio richiesta upload...');
      const response = await api.post('/api/users/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Risposta server:', response.data);

      if (response.data.success) {
        const fotoProfilo = response.data.data.fotoProfilo;
        console.log('Foto profilo dal server:', fotoProfilo);

        const cleanedPath = fotoProfilo.replace('http://localhost:5000/uploads/', '');
        console.log('Percorso pulito:', cleanedPath);

        const updatedUser = {
          ...user!,
          fotoProfilo: cleanedPath
        };
        console.log('Utente aggiornato:', updatedUser);
        
        updateUser(updatedUser);

        const newImageUrl = `/uploads/${cleanedPath}`;
        console.log('URL finale immagine:', newImageUrl);
        
        setImageUrl(newImageUrl);
        setAvatarKey(Date.now());

        toast({
          title: 'Successo',
          description: 'Immagine del profilo aggiornata',
          variant: "success"
        });
      }
    } catch (error: any) {
      console.error('Errore completo:', error);
      console.error('Response data:', error.response?.data);
      toast({
        title: 'Errore',
        description: error.response?.data?.message || 'Errore durante il caricamento dell\'immagine',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file immagine valido (JPG, PNG, etc.)',
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Errore',
        description: 'L\'immagine non può superare i 5MB',
        variant: "destructive"
      });
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!selectedImage) return null;

    setIsImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedImage);

      const response = await api.post(`/api/users/${userId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        return response.data.data.fotoProfilo;
      }
      return null;
    } catch (error) {
      console.error('Errore durante l\'upload dell\'immagine:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare l\'immagine del profilo',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    console.log('=== INIZIO PROCESSO DI ELIMINAZIONE ===');
    console.log('Utente selezionato:', selectedUser);
    
    try {
      console.log(`Invio richiesta DELETE a /api/admin/users/${selectedUser.id}`);
      const response = await api.delete(`/api/admin/users/${selectedUser.id}`);
      
      console.log('Risposta dal server:', response.data);
      
      if (response.data.success) {
        console.log('Eliminazione riuscita, aggiorno UI...');
        
        setIsDeleteDialogOpen(false);
        
        toast({
          title: "Utente eliminato",
          description: `${selectedUser.nome} ${selectedUser.cognome} è stato eliminato con successo.`,
          variant: "success"
        });

        console.log('Lista utenti prima dell\'aggiornamento:', users);
        const updatedUsers = users.filter(user => user.id !== selectedUser.id);
        console.log('Lista utenti dopo l\'aggiornamento:', updatedUsers);
        setUsers(updatedUsers);
        
        console.log('=== FINE PROCESSO DI ELIMINAZIONE (Successo) ===');
      }
    } catch (error: any) {
      console.log('=== ERRORE DURANTE L\'ELIMINAZIONE ===');
      console.error('Errore completo:', error);
      console.error('Response data:', error.response?.data);
      console.error('Stack trace:', error.stack);
      
      toast({
        title: "Errore durante l'eliminazione",
        description: `Dettagli: ${error.response?.data?.details || error.response?.data?.error || error.message}`,
        variant: "destructive"
      });
      
      setIsDeleteDialogOpen(false);
      console.log('=== FINE PROCESSO DI ELIMINAZIONE (Errore) ===');
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.data?.data?.ruolo !== 'ADMIN') {
          navigate('/dashboard');
        }
      } catch (error) {
        navigate('/login');
      }
    };

    const fetchData = async () => {
      try {
        console.log('Iniziando il recupero dei dati dashboard...');
        
        // Recupera tutti i dati necessari
        const [statsRes, trendsRes, serviceStatsRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/booking-trends'),
          api.get('/api/admin/service-stats')
        ]);

        // Gestione statistiche generali
        if (statsRes.data.success) {
          const normalizedStats = {
            totalUsers: Number(statsRes.data.data.totalUsers) || 0,
            totalBookings: Number(statsRes.data.data.totalBookings) || 0,
            totalRevenue: Number(statsRes.data.data.totalRevenue) || 0,
            averageBookingsPerUser: Number(statsRes.data.data.averageBookingsPerUser) || 0,
            todayBookings: Number(statsRes.data.data.todayBookings) || 0,
            activeServices: Number(statsRes.data.data.activeServices) || 0,
            bookingTrends: trendsRes.data.success ? trendsRes.data.data : [],
            popularServices: serviceStatsRes.data.success ? serviceStatsRes.data.data.popularServices : [],
            timeSlotDistribution: serviceStatsRes.data.success ? serviceStatsRes.data.data.timeSlotDistribution : []
          };
          setStats(normalizedStats);
        }

        // Recupera i servizi
        const servicesRes = await api.get<ApiResponse<Service[]>>('/api/services');
        if (servicesRes.data.success) {
          setServices(servicesRes.data.data);
        }

        // Recupera le prenotazioni
        const bookingsRes = await api.get('/api/admin/bookings');
        if (bookingsRes.data.success) {
          setBookings(bookingsRes.data.data);
        }

      } catch (error: any) {
        console.error('Errore nel recupero dei dati:', error);
        toast({
          title: 'Errore',
          description: 'Si è verificato un errore nel caricamento dei dati. Riprova più tardi.',
          variant: "destructive"
        });
      }
    };

    checkAdmin();
    fetchUsers();
    fetchData();
  }, [navigate, toast]);

  const handleEditBooking = (booking: Booking) => {
    const bookingDate = new Date(booking.dataOra);
    const formattedDate = bookingDate.toISOString().split('T')[0];
    const formattedTime = bookingDate.toTimeString().slice(0, 5);

    setSelectedBooking(booking);
    setEditedBooking({
      data: formattedDate,
      ora: formattedTime,
      stato: booking.stato,
      serviceId: booking.servizi[0]?.servizio.id
    });
    setIsEditBookingModalOpen(true);
  };

  const handleSaveBooking = async () => {
    try {
      if (!selectedBooking || !editedBooking.data || !editedBooking.ora || !editedBooking.serviceId) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori",
          variant: "destructive"
        });
        return;
      }

      const dataOra = new Date(`${editedBooking.data}T${editedBooking.ora}`).toISOString();

      const bookingData = {
        dataOra,
        stato: editedBooking.stato || selectedBooking.stato,
        serviceId: editedBooking.serviceId
      };

      console.log('Dati inviati all\'API:', bookingData);

      const response = await api.put(`/api/bookings/${selectedBooking.id}`, bookingData);

      if (response.data.success) {
        const bookingsResponse = await api.get('/api/admin/bookings');
        setBookings(bookingsResponse.data.data);

        toast({
          title: "Successo",
          description: "Prenotazione aggiornata con successo",
          variant: "success"
        });

        setIsEditBookingModalOpen(false);
        setSelectedBooking(null);
        setEditedBooking({});
      }
    } catch (error: any) {
      console.error('Errore durante il salvataggio della prenotazione:', error);
      console.log('Dettagli errore:', error.response?.data);
      
      toast({
        title: "Errore",
        description: error.response?.data?.error || "Errore durante il salvataggio della prenotazione",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBooking = async () => {
    try {
      if (!selectedBooking) return;

      const response = await api.delete(`/api/bookings/${selectedBooking.id}`);

      if (response.data.success) {
        const bookingsResponse = await api.get('/api/admin/bookings');
        setBookings(bookingsResponse.data.data);

        toast({
          title: "Successo",
          description: "Prenotazione eliminata con successo",
          variant: "success"
        });

        setIsDeleteBookingDialogOpen(false);
        setSelectedBooking(null);
      }
    } catch (error: any) {
      console.error('Errore durante l\'eliminazione della prenotazione:', error);
      toast({
        title: "Errore",
        description: error.response?.data?.error || "Errore durante l'eliminazione",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    users.forEach(user => {
      console.log(`Rendering genere per ${user.nome} ${user.cognome}:`, {
        genere: user.genere,
        tipo: typeof user.genere,
        raw: user
      });
    });
  }, [users]);

  const filteredBookings = bookings.filter(booking => {
    const statusMatch = bookingStatusFilter === 'all' || booking.stato === bookingStatusFilter;
    return statusMatch;
  });

  const handleAddService = async (serviceData: Service) => {
    console.log('[AdminDashboard] Inizio handleAddService con dati:', serviceData);
    try {
      setIsLoading(true);
      
      // Prepara i dati per l'invio
      const normalizedData = {
        ...serviceData,
        nome: serviceData.nome.trim(),
        descrizione: serviceData.descrizione.trim(),
        prezzo: Number(serviceData.prezzo.toFixed(2)), // Assicuriamoci che il prezzo sia un numero con 2 decimali
        durata: Math.round(serviceData.durata / 5) * 5,
        categoria: serviceData.categoria.trim().toUpperCase()
      };

      console.log('[AdminDashboard] Dati normalizzati prima dell\'invio:', normalizedData);

      // Usa l'URL relativo per le chiamate API
      const response = await api.post('/api/services', normalizedData);
      console.log('[AdminDashboard] Risposta dal server:', response.data);

      if (response.data.success) {
        console.log('[AdminDashboard] Servizio creato con successo:', response.data.data);
        setServices(prevServices => [...prevServices, response.data.data]);
        toast({
          title: "Successo",
          description: `Il servizio "${normalizedData.nome}" è stato creato`,
          variant: "success"
        });
        return response.data.data;
      } else {
        console.error('[AdminDashboard] Errore nella risposta del server:', response.data.error);
        toast({
          title: "Errore",
          description: response.data.error || 'Errore durante l\'aggiunta del servizio',
          variant: "destructive"
        });
        throw new Error(response.data.error || 'Errore durante l\'aggiunta del servizio');
      }
    } catch (error: any) {
      console.error('[AdminDashboard] Errore dettagliato:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
        stack: error.stack
      });
      const errorMessage = error.response?.data?.error || error.message || 'Errore durante l\'aggiunta del servizio';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = (service: Service) => {
    console.log('Servizio selezionato per modifica:', service);
    setSelectedService(service);
    setEditedService({
      nome: service.nome,
      descrizione: service.descrizione,
      durata: service.durata.toString(),
      prezzo: service.prezzo.toString(),
      categoria: service.categoria
    });
    setIsAddServiceDialogOpen(true);
  };

  const handleDeleteServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteServiceDialogOpen(true);
  };

  const handleDeleteService = async () => {
    try {
      if (!selectedService) {
        toast({
          title: "Errore",
          description: "Nessun servizio selezionato",
          variant: "destructive"
        });
        return;
      }

      const response = await api.delete(`/api/services/${selectedService.id}`);

      if (response.data.success) {
        await fetchServices();
        toast({
          title: "Successo",
          description: "Servizio eliminato con successo",
          variant: "success"
        });
        setIsDeleteServiceDialogOpen(false);
        setSelectedService(undefined);
      }
    } catch (error: any) {
      console.error('Errore durante l\'eliminazione del servizio:', error);
      toast({
        title: "Errore",
        description: error.response?.data?.error || "Errore durante l'eliminazione del servizio",
        variant: "destructive"
      });
      throw error; // Rilanciamo l'errore per gestirlo nel DeleteServiceDialog
    }
  };

  const handleServiceSuccess = async () => {
    await fetchServices();
    toast({
      title: "Successo",
      description: "Lista servizi aggiornata",
      variant: "success"
    });
  };

  const handleUpdateService = async () => {
    try {
      if (!selectedService) return;

      // Validazione
      if (!editedService.nome || !editedService.descrizione || !editedService.categoria) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori",
          variant: "destructive"
        });
        return;
      }

      // Validazione numerica
      const prezzo = parseFloat(editedService.prezzo);
      const durata = parseInt(editedService.durata);

      if (isNaN(prezzo) || prezzo < 0 || prezzo > 1000) {
        toast({
          title: "Errore",
          description: "Il prezzo deve essere un numero valido tra 0 e 1000",
          variant: "destructive"
        });
        return;
      }

      if (isNaN(durata) || durata < 15 || durata > 240) {
        toast({
          title: "Errore",
          description: "La durata deve essere un numero valido tra 15 e 240 minuti",
          variant: "destructive"
        });
        return;
      }

      // Prepara i dati per l'API - rimuoviamo il campo punti
      const serviceData = {
        nome: editedService.nome.trim(),
        descrizione: editedService.descrizione.trim(),
        durata: durata,
        prezzo: prezzo,
        categoria: editedService.categoria
      };

      console.log('Invio dati aggiornamento:', serviceData);

      const response = await api.put(`/api/services/${selectedService.id}`, serviceData);

      if (response.data.success) {
        await fetchServices();
        toast({
          title: "Successo",
          description: "Servizio modificato con successo",
          variant: "success"
        });
        setIsAddServiceDialogOpen(false);
        setSelectedService(undefined);
        setEditedService({
          nome: '',
          descrizione: '',
          durata: '30',
          prezzo: '0',
          categoria: ''
        });
      }
    } catch (error: any) {
      console.error('Errore durante la modifica del servizio:', error.response?.data || error);
      
      let errorMessage = "Errore durante la modifica del servizio";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        // Rimuovi i dettagli tecnici di Prisma dal messaggio di errore
        errorMessage = "Si è verificato un errore durante l'aggiornamento del servizio. Riprova più tardi.";
      }

      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSaveBarber = async () => {
    try {
      setIsLoading(true);
      
      if (!userToConvert) return;

      // Prima aggiorna l'utente
      const updateResponse = await api.put(`/api/users/${userToConvert.id}`, {
        nome: userToConvert.nome,
        cognome: userToConvert.cognome,
        email: userToConvert.email,
        telefono: userToConvert.telefono || '',
        ruolo: 'BARBIERE',
        genere: userToConvert.genere
      });

      if (updateResponse.data.success) {
        // Poi crea il record barbiere con le informazioni aggiuntive
        const barberResponse = await api.post(`/api/admin/barbers`, {
          utenteId: userToConvert.id,
          specialita: barberInfo.specialita,  // Ora è un array
          descrizione: barberInfo.descrizione,
          orariLavoro: barberInfo.orariLavoro  // Array di orari per ogni giorno
        });

        if (barberResponse.data.success) {
          setIsBarberModalOpen(false);
          setUserToConvert(null);
          setBarberInfo({
            specialita: [],
            descrizione: '',
            orariLavoro: [
              { giorno: 1, oraInizio: '09:00', oraFine: '18:00' },
              { giorno: 2, oraInizio: '09:00', oraFine: '18:00' },
              { giorno: 3, oraInizio: '09:00', oraFine: '18:00' },
              { giorno: 4, oraInizio: '09:00', oraFine: '18:00' },
              { giorno: 5, oraInizio: '09:00', oraFine: '18:00' },
            ]
          });
          
          await fetchUsers();

          toast({
            title: "Successo",
            description: "Barbiere creato correttamente",
            variant: "success"
          });
        }
      }
    } catch (error: any) {
      console.error("Errore nel creare il barbiere:", error);
      toast({
        title: "Errore",
        description: error.response?.data?.error || "Errore nel creare il barbiere",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center gap-8">
              <div 
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <Avatar className="h-20 w-20 relative">
                  {isUploading ? (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-700">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                  ) : (
                    <>
                      <AvatarImage 
                        key={avatarKey}
                        src={imageUrl}
                        alt={`${user?.nome || ''} ${user?.cognome || ''}`}
                        onError={(e) => {
                          console.error('Errore caricamento immagine');
                          console.error('URL che ha causato errore:', imageUrl);
                          console.error('Avatar key:', avatarKey);
                          console.error('User foto profilo:', user?.fotoProfilo);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        className="object-cover"
                        style={{ display: 'block' }}
                      />
                      <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xl">
                        {user?.nome?.[0]}{user?.cognome?.[0]}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                  Dashboard Amministratore
                </h1>
                <p className="text-lg text-zinc-400">
                  Benvenut{user?.genere === 'F' ? 'a' : 'o'}, {user?.nome} {user?.cognome}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="hover:bg-zinc-800 transition-colors px-6 py-2"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 hover:border-amber-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">
                Clienti Totali
              </CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-zinc-100">
                  {users.filter(user => user.ruolo === "CLIENTE").length}
                </p>
                <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{users.filter(user => user.ruolo === "CLIENTE").length === 1 ? "Cliente" : "Clienti"} registrati</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 hover:border-amber-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">
                Prenotazioni Oggi
              </CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-zinc-100">
                  {bookings.length}
                </p>
                <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className={bookings.length === 1 ? "text-green-500" : "text-red-500"}>
                    {bookings.length === 1 ? "Prenotazione" : "Prenotazioni"} effettuate
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 hover:border-amber-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">
                Incasso Totale
              </CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Euro className="h-6 w-6 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-zinc-100">
                  €{calculateTotalBookingsAmount(bookings).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-500">Da {bookings.length} {bookings.length === 1 ? "prenotazione" : "prenotazioni"}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs 
          defaultValue="users" 
          className="space-y-6"
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-zinc-800/50 p-1 rounded-lg">
              {[
                { value: 'users', label: 'Utenti' },
                { value: 'bookings', label: 'Prenotazioni' },
                { value: 'services', label: 'Servizi' },
                { value: 'analytics', label: 'Analisi Dati' },
                { value: 'barbers', label: 'Barbieri' }
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-amber-600 
                             data-[state=active]:text-white transition-all duration-200"
                >
                  <TabIcon value={tab.value} />
                  <TabTitle value={tab.value} />
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Cerca..." 
                  className="pl-9 bg-zinc-800/50 border-zinc-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="users">
                <Card className="border-zinc-700/50 bg-zinc-800/30">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Gestione Utenti</CardTitle>
                        <CardDescription>
                          Gestisci tutti gli utenti del sistema
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedUser(null);
                          setEditedUser({});
                          setIsEditModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Aggiungi Utente
                      </Button>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card className="bg-zinc-800/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Users className="mx-auto h-6 w-6 text-zinc-400" />
                            <h3 className="mt-2 font-semibold">Totale Utenti</h3>
                            <div className="mt-1 flex items-center justify-center gap-1">
                              <p className="text-2xl font-bold">{users.length}</p>
                              <span className="text-xs text-zinc-500">utenti</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-zinc-800/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Scissors className="mx-auto h-6 w-6 text-green-400" />
                            <h3 className="mt-2 font-semibold">Barbieri</h3>
                            <div className="mt-1 flex items-center justify-center gap-1">
                              <p className="text-2xl font-bold">
                                {users.filter(u => u.ruolo === 'BARBIERE').length}
                              </p>
                              <span className="text-xs text-zinc-500">
                                {Math.round((users.filter(u => u.ruolo === 'BARBIERE').length / users.length) * 100)}% del totale
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-zinc-800/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <UserCircle2 className="mx-auto h-6 w-6 text-blue-400" />
                            <h3 className="mt-2 font-semibold">Clienti</h3>
                            <div className="mt-1 flex items-center justify-center gap-1">
                              <p className="text-2xl font-bold">
                                {users.filter(u => u.ruolo === 'CLIENTE').length}
                              </p>
                              <span className="text-xs text-zinc-500">
                                {Math.round((users.filter(u => u.ruolo === 'CLIENTE').length / users.length) * 100)}% del totale
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-zinc-800/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <ShieldCheck className="mx-auto h-6 w-6 text-red-400" />
                            <h3 className="mt-2 font-semibold">Amministratori</h3>
                            <div className="mt-1 flex items-center justify-center gap-1">
                              <p className="text-2xl font-bold">
                                {users.filter(u => u.ruolo === 'ADMIN').length}
                              </p>
                              <span className="text-xs text-zinc-500">
                                {Math.round((users.filter(u => u.ruolo === 'ADMIN').length / users.length) * 100)}% del totale
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          placeholder="Cerca utenti..."
                          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 pl-8 text-sm focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select
                        value={roleFilter}
                        onValueChange={setRoleFilter}
                      >
                        <SelectTrigger className="w-[180px] border-zinc-800 bg-zinc-950">
                          <SelectValue placeholder="Filtra per ruolo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="ADMIN">Amministratori</SelectItem>
                          <SelectItem value="BARBIERE">Barbieri</SelectItem>
                          <SelectItem value="CLIENTE">Clienti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b border-zinc-800">
                            <TableHead className="w-[50px]">Foto</TableHead>
                            <TableHead className="min-w-[200px]">Nome</TableHead>
                            <TableHead className="min-w-[200px]">Email</TableHead>
                            <TableHead className="min-w-[120px]">Telefono</TableHead>
                            <TableHead className="min-w-[120px]">Ruolo</TableHead>
                            <TableHead className="w-[100px] text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users
                            .filter(user => {
                              const searchMatch = 
                                (user.nome?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                                (user.cognome?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                                (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                                (user.telefono?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
                              
                              const roleMatch = roleFilter === 'all' || user.ruolo === roleFilter;
                              
                              return searchMatch && roleMatch;
                            })
                            .map((user) => (
                              <TableRow 
                                key={user.id}
                                className="group transition-all duration-200 hover:bg-zinc-800/50"
                              >
                                <TableCell>
                                  <div className="relative">
                                    <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-zinc-950 ring-zinc-800 transition-all duration-200 group-hover:ring-zinc-700">
                                      {user.fotoProfilo ? (
                                        <AvatarImage 
                                          src={`${import.meta.env.VITE_API_URL}/uploads/${user.fotoProfilo}`}
                                          alt={`${user.nome} ${user.cognome}`}
                                          className="object-cover"
                                        />
                                      ) : (
                                        <AvatarFallback className="bg-amber-500/10 text-amber-500">
                                          {user.nome?.[0]}
                                          {user.cognome?.[0]}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    {user.online && (
                                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-green-500 shadow-sm" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col space-y-1">
                                    <span className="font-medium text-zinc-100 group-hover:text-white">
                                      {user.nome} {user.cognome}
                                    </span>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="flex items-center gap-1 text-zinc-500">
                                        <span className={`text-sm ${user.genere === 'F' ? 'text-pink-400' : 'text-blue-400'}`}>
                                          @{user.genere === 'F' ? 'Donna' : 'Uomo'}
                                        </span>
                                      </span>
                                      {user.dataNascita && (
                                        <>
                                          <span className="text-zinc-700">•</span>
                                          <span className="text-zinc-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(user.dataNascita).toLocaleDateString()}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-zinc-100">{user.email}</span>
                                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                                      <Clock className="h-3 w-3" />
                                      Registrato il {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {user.telefono ? (
                                    <div className="flex flex-col space-y-1">
                                      <span className="font-medium text-zinc-100">{user.telefono}</span>
                                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verificato
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="flex items-center gap-1 text-sm text-zinc-500">
                                      <XCircle className="h-3 w-3" />
                                      Non specificato
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={getRoleBadgeVariant(user.ruolo)}
                                    className="transition-all duration-200 group-hover:scale-105"
                                  >
                                    {getRoleDisplayName(user.ruolo)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditUser(user)}
                                      className="h-8 w-8 hover:bg-zinc-700"
                                    >
                                      <Settings className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card className="border-zinc-700/50 bg-zinc-800/30">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Gestione Prenotazioni</CardTitle>
                        <CardDescription>
                          Gestisci tutte le prenotazioni del sistema
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={bookingStatusFilter}
                          onValueChange={setBookingStatusFilter}
                        >
                          <SelectTrigger className="w-[180px] bg-zinc-800/50 border-zinc-700">
                            <SelectValue placeholder="Filtra per stato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti gli stati</SelectItem>
                            <SelectItem value="pending">In Attesa</SelectItem>
                            <SelectItem value="confirmed">Confermata</SelectItem>
                            <SelectItem value="completed">Completata</SelectItem>
                            <SelectItem value="cancelled">Cancellata</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-zinc-800/50">
                          <TableRow>
                            <TableHead className="text-zinc-400">Cliente</TableHead>
                            <TableHead className="text-zinc-400">Data e Ora</TableHead>
                            <TableHead className="text-zinc-400">Servizio</TableHead>
                            <TableHead className="text-zinc-400">Prezzo</TableHead>
                            <TableHead className="text-zinc-400">Stato</TableHead>
                            <TableHead className="text-zinc-400 text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBookings.map((booking) => {
                            const bookingDate = new Date(booking.dataOra);
                            const formattedDate = bookingDate.toLocaleDateString('it-IT');
                            const formattedTime = bookingDate.toTimeString().slice(0, 5);

                            return (
                              <TableRow key={booking.id} className="hover:bg-zinc-800/30">
                                <TableCell className="font-medium text-zinc-200">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage 
                                        src={`/uploads/${booking.utente?.fotoProfilo}`}
                                        alt={`${booking.utente?.nome} ${booking.utente?.cognome}`}
                                      />
                                      <AvatarFallback className="bg-amber-500/10 text-amber-500">
                                        {booking.utente?.nome?.[0]}
                                        {booking.utente?.cognome?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{booking.utente?.nome} {booking.utente?.cognome}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-zinc-200">
                                    <p>{formattedDate}</p>
                                    <p className="text-sm text-zinc-400">{formattedTime}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {booking.servizi.map((s, index) => (
                                    <Badge 
                                      key={`${s.servizio.id}-${index}`}
                                      variant="outline" 
                                      className="bg-amber-500/10 text-amber-500 border-amber-500/20 mr-1"
                                    >
                                      {s.servizio.nome}
                                    </Badge>
                                  ))}
                                </TableCell>
                                <TableCell className="text-zinc-200">
                                  €{(booking.servizi?.reduce((acc, s) => {
                                    const prezzo = Number(s.servizio?.prezzo) || 0;
                                    return acc + prezzo;
                                  }, 0) || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getBadgeVariant(booking.stato)}>
                                    {booking.stato}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditBooking(booking)}
                                      className="hover:bg-zinc-800"
                                    >
                                      <Pencil className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setIsDeleteBookingDialogOpen(true);
                                      }}
                                      className="hover:bg-zinc-800"
                                    >
                                      <Trash2 className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <Card className="border-zinc-700/50 bg-zinc-800/30">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Gestione Servizi</CardTitle>
                        <CardDescription>
                          Gestisci i servizi offerti dal barbershop
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setShowAddModal(true)}
                          className="bg-amber-500 text-zinc-900 hover:bg-amber-600"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Aggiungi Servizio
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-zinc-800/50">
                          <TableRow>
                            <TableHead className="text-zinc-400">Nome Servizio</TableHead>
                            <TableHead className="text-zinc-400">Descrizione</TableHead>
                            <TableHead className="text-zinc-400">Durata (minuti)</TableHead>
                            <TableHead className="text-zinc-400">Prezzo</TableHead>
                            <TableHead className="text-zinc-400 text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {services.map((service) => (
                            <TableRow key={service.id} className="hover:bg-zinc-800/30">
                              <TableCell className="font-medium text-zinc-200">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  >
                                    {service.nome}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-zinc-200">
                                {service.descrizione}
                              </TableCell>
                              <TableCell className="text-zinc-200">
                                {service.durata} min
                              </TableCell>
                              <TableCell className="text-zinc-200">
                                €{Number(service.prezzo).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditService(service)}
                                    className="hover:bg-zinc-800"
                                  >
                                    <Pencil className="h-4 w-4 text-zinc-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteServiceClick(service)}
                                    className="hover:bg-zinc-800"
                                  >
                                    <Trash2 className="h-4 w-4 text-zinc-400" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <AddServiceModal
                  open={showAddModal}
                  onOpenChange={setShowAddModal}
                  onAddService={handleAddService}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <div className="space-y-4"> 
                  {/* Header della sezione analytics */}
                  <div className="bg-zinc-900 p-4 rounded-lg shadow-lg border border-zinc-800">
                    <h2 className="text-xl font-semibold mb-2 text-zinc-100">Panoramica Statistiche</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-900/20 rounded-md border border-blue-900/30">
                        <p className="text-sm text-blue-400 font-medium">Prenotazioni Oggi</p>
                        <p className="text-2xl font-bold text-blue-300">{stats?.todayBookings || 0}</p>
                      </div>
                      <div className="p-3 bg-green-900/20 rounded-md border border-green-900/30">
                        <p className="text-sm text-green-400 font-medium">Servizi Attivi</p>
                        <p className="text-2xl font-bold text-green-300">{stats?.activeServices || 0}</p>
                      </div>
                      <div className="p-3 bg-purple-900/20 rounded-md border border-purple-900/30">
                        <p className="text-sm text-purple-400 font-medium">Media Prenotazioni/Utente</p>
                        <p className="text-2xl font-bold text-purple-300">{stats?.averageBookingsPerUser?.toFixed(1) || '0'}</p>
                      </div>
                      <div className="p-3 bg-amber-900/20 rounded-md border border-amber-900/30">
                        <p className="text-sm text-amber-400 font-medium">Fatturato Mensile</p>
                        <p className="text-2xl font-bold text-amber-300">€{stats?.totalRevenue?.toFixed(0) || '0'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grafici principali in grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 p-4">
                      <div className="h-[200px]">
                        {stats?.bookingTrends && (
                          <BookingTrendsChart data={stats.bookingTrends} />
                        )}
                      </div>
                    </div>
                    <div className="bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 p-4">
                      <div className="h-[200px]">
                        {stats?.popularServices && (
                          <PopularServicesChart data={stats.popularServices} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grafico distribuzione oraria */}
                  <div className="bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 p-4">
                    <div className="h-[180px]">
                      {stats?.timeSlotDistribution && (
                        <TimeSlotChart data={stats.timeSlotDistribution} />
                      )}
                    </div>
                  </div>

                  {/* Azioni e filtri */}
                  <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-lg shadow-lg border border-zinc-800">
                    <div className="flex gap-4">
                      <Select>
                        <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
                          <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
                          <SelectItem value="90d">Ultimi 3 mesi</SelectItem>
                          <SelectItem value="365d">Ultimo anno</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Tipo Servizio" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="all">Tutti i servizi</SelectItem>
                          <SelectItem value="taglio">Solo tagli</SelectItem>
                          <SelectItem value="barba">Solo barba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-100">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-100">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="barbers">
                <BarbersManagement />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        <ServiceDialog
          open={serviceDialogOpen}
          onOpenChange={setServiceDialogOpen}
          service={selectedService}
          onSuccess={handleServiceSuccess}
        />

        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            setEditedUser({});
            setShowPassword(false);
            setPreviewImage(null);
            setSelectedImage(null);
            setSelectedUser(null);
            setSearchQuery("");
            setRoleFilter("all");
          }
        }}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedUser ? 'Modifica Utente' : 'Nuovo Utente'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser ? 'Modifica i dettagli dell\'utente selezionato.' : 'Inserisci i dettagli del nuovo utente.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-2 border-zinc-700 hover:border-amber-500 transition-colors"
                  onClick={handleProfileImageClick}
                >
                  {previewImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center">
                      <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                      <span className="text-xs text-zinc-400 text-center px-2 absolute bottom-2 left-0 right-0">
                        Click per selezionare
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={editedUser.nome || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, nome: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cognome">Cognome *</Label>
                  <Input
                    id="cognome"
                    value={editedUser.cognome || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, cognome: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedUser.email || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={editedUser.telefono || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, telefono: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label> Ruolo *</Label>
                  <Select 
                    value={editedUser.ruolo || 'CLIENTE'}
                    onValueChange={(value) => setEditedUser({ ...editedUser, ruolo: value as 'ADMIN' | 'BARBIERE' | 'CLIENTE' })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Seleziona ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Amministratore</SelectItem>
                      <SelectItem value="BARBIERE">Barbiere</SelectItem>
                      <SelectItem value="CLIENTE">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Genere *</Label>
                  <Select
                    value={editedUser.genere || 'M'}
                    onValueChange={(value) => setEditedUser({ ...editedUser, genere: value as 'M' | 'F' })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Seleziona genere" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschio</SelectItem>
                      <SelectItem value="F">Femmina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!selectedUser && (
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={editedUser.password || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, password: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "Nascondi" : "Mostra"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditedUser({});
                  setShowPassword(false);
                  setPreviewImage(null);
                  setSelectedImage(null);
                  setSelectedUser(null);
                  setSearchQuery("");
                  setRoleFilter("all");
                }}
              >
                Annulla
              </Button>
              <Button onClick={() => handleSaveUser(editedUser)} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  selectedUser ? 'Salva Modifiche' : 'Crea Utente'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditBookingModalOpen} onOpenChange={setIsEditBookingModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Modifica Prenotazione</DialogTitle>
              <DialogDescription>
                Modifica i dettagli della prenotazione. I campi contrassegnati con * sono obbligatori.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="px-3 py-2 bg-zinc-800 rounded-md">
                  {selectedBooking?.utente.nome} {selectedBooking?.utente.cognome}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Servizio *</Label>
                <Select
                  value={editedBooking.serviceId?.toString()}
                  onValueChange={(value) => setEditedBooking({ ...editedBooking, serviceId: parseInt(value) })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Seleziona servizio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={editedBooking.data}
                    onChange={(e) => setEditedBooking({ ...editedBooking, data: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ora">Ora *</Label>
                  <Input
                    id="ora"
                    type="time"
                    value={editedBooking.ora}
                    onChange={(e) => setEditedBooking({ ...editedBooking, ora: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stato">Stato *</Label>
                <Select
                  value={editedBooking.stato}
                  onValueChange={(value) => setEditedBooking({ ...editedBooking, stato: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">In Attesa</SelectItem>
                    <SelectItem value="confirmed">Confermata</SelectItem>
                    <SelectItem value="completed">Completata</SelectItem>
                    <SelectItem value="cancelled">Cancellata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditBookingModalOpen(false);
                  setSelectedBooking(null);
                  setEditedBooking({});
                }}
              >
                Annulla
              </Button>
              <Button onClick={handleSaveBooking}>
                Salva Modifiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700">
                Annulla
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteUser}
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteBookingDialogOpen} onOpenChange={setIsDeleteBookingDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. La prenotazione verrà eliminata permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteBookingDialogOpen(false);
                setSelectedBooking(null);
              }}>
                Annulla
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBooking}>
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isDeleteServiceDialogOpen} onOpenChange={setIsDeleteServiceDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Conferma eliminazione</DialogTitle>
              <DialogDescription>
                Sei sicuro di voler eliminare il servizio "{selectedService?.nome}"?
                Questa azione non può essere annullata.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteServiceDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteService}
              >
                Elimina
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>
                {selectedService ? 'Modifica Servizio' : 'Aggiungi Servizio'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={editedService.nome || ''}
                  onChange={(e) => setEditedService({
                    ...editedService,
                    nome: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  value={editedService.descrizione || ''}
                  onChange={(e) => setEditedService({
                    ...editedService,
                    descrizione: e.target.value
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={editedService.categoria || ''}
                  onChange={(e) => setEditedService({
                    ...editedService,
                    categoria: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="durata">Durata (min)</Label>
                  <Input
                    id="durata"
                    type="number"
                    min="15"
                    max="240"
                    step="5"
                    value={editedService.durata || ''}
                    onChange={(e) => setEditedService({
                      ...editedService,
                      durata: e.target.value
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prezzo">Prezzo (€)</Label>
                  <Input
                    id="prezzo"
                    type="number"
                    min="0.5"
                    max="1000"
                    step="0.5"
                    value={editedService.prezzo || ''}
                    onChange={(e) => setEditedService({
                      ...editedService,
                      prezzo: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddServiceDialogOpen(false);
                  setSelectedService(undefined);
                  setEditedService({
                    nome: '',
                    descrizione: '',
                    durata: '30',
                    prezzo: '0',
                    categoria: ''
                  });
                }}
              >
                Annulla
              </Button>
              <Button
                onClick={selectedService ? handleUpdateService : handleAddService}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {selectedService ? 'Salva Modifiche' : 'Aggiungi Servizio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBarberModalOpen} onOpenChange={setIsBarberModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <DialogHeader>
              <DialogTitle>Informazioni Barbiere</DialogTitle>
              <DialogDescription>
                Inserisci le informazioni aggiuntive per il barbiere
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="specialita">Specialità (separate da virgola)</Label>
                <Input
                  id="specialita"
                  placeholder="Es: Taglio classico, Barba, Shampoo..."
                  value={barberInfo.specialita.join(', ')}
                  onChange={(e) => setBarberInfo(prev => ({
                    ...prev,
                    specialita: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  placeholder="Breve descrizione del barbiere..."
                  value={barberInfo.descrizione}
                  onChange={(e) => setBarberInfo(prev => ({...prev, descrizione: e.target.value}))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Orari di Lavoro</Label>
                <div className="space-y-4">
                  {barberInfo.orariLavoro.map((orario, index) => (
                    <div key={orario.giorno} className="flex items-center gap-4">
                      <div className="w-24">
                        {['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][orario.giorno]}:
                      </div>
                      <Input
                        type="time"
                        value={orario.oraInizio}
                        onChange={(e) => {
                          const newOrari = [...barberInfo.orariLavoro];
                          newOrari[index] = { ...orario, oraInizio: e.target.value };
                          setBarberInfo(prev => ({ ...prev, orariLavoro: newOrari }));
                        }}
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={orario.oraFine}
                        onChange={(e) => {
                          const newOrari = [...barberInfo.orariLavoro];
                          newOrari[index] = { ...orario, oraFine: e.target.value };
                          setBarberInfo(prev => ({ ...prev, orariLavoro: newOrari }));
                        }}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsBarberModalOpen(false);
                  setUserToConvert(null);
                  setBarberInfo({
                    specialita: [],
                    descrizione: '',
                    orariLavoro: [
                      { giorno: 1, oraInizio: '09:00', oraFine: '18:00' },
                      { giorno: 2, oraInizio: '09:00', oraFine: '18:00' },
                      { giorno: 3, oraInizio: '09:00', oraFine: '18:00' },
                      { giorno: 4, oraInizio: '09:00', oraFine: '18:00' },
                      { giorno: 5, oraInizio: '09:00', oraFine: '18:00' },
                    ]
                  });
                }}
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSaveBarber}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
