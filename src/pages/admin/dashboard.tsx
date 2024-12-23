import { useState, useEffect } from 'react';
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
import { LogOut, Camera, Loader2, Users, Calendar, Scissors, Star, TrendingUp, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { ServiceDialog } from '@/components/ServiceDialog';
import BarbersManagement from '@/components/BarbersManagement';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: string;
  createdAt: string;
  fotoProfilo?: string;
}

interface Booking {
  id: string;
  dataOra: string;
  utente: {
    nome: string;
    cognome: string;
  };
  servizi: {
    servizio: {
      nome: string;
      prezzo: number;
    };
  }[];
}

interface Service {
  id: string;
  nome: string;
  descrizione: string;
  prezzo: number;
  durata: number;
  categoria: 'TAGLIO' | 'BARBA' | 'TRATTAMENTO' | 'COLORAZIONE' | 'COMBO';
  punti: number;
}

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  averageBookingsPerUser: number;
  todayBookings: number;
  monthlyRevenue: number;
  activeServices: number;
  averageRating: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingsPerUser: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    activeServices: 0,
    averageRating: 0
  });
  const [services, setServices] = useState<Service[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, bookingsRes, statsRes, servicesRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/bookings'),
          api.get('/admin/stats'),
          api.get('/admin/services')
        ]);

        setUsers(usersRes.data.data);
        setBookings(bookingsRes.data.data);
        setStats(statsRes.data.data);
        setServices(servicesRes.data.data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: error.response?.data?.message || 'Errore nel caricamento dei dati'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Per favore seleziona un\'immagine valida'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'L\'immagine deve essere più piccola di 5MB'
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.post('/admin/upload-photo', formData);
      if (response.data.success) {
        updateUser({ ...user!, fotoProfilo: response.data.data.fotoProfilo });
        toast({
          title: 'Successo',
          description: 'Immagine del profilo aggiornata'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.response?.data?.message || 'Errore durante il caricamento dell\'immagine'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleServiceAction = async (service?: Service) => {
    setSelectedService(service);
    setServiceDialogOpen(true);
  };

  const handleServiceSuccess = async () => {
    setServiceDialogOpen(false);
    setSelectedService(undefined);
    // Ricarica i servizi
    const response = await api.get('/admin/services');
    setServices(response.data.data);
    toast({
      title: 'Successo',
      description: 'Servizio aggiornato con successo'
    });
  };

  const handleDeleteUser = async () => {
    console.log('=== INIZIO handleDeleteUser ===');
    console.log('Stato corrente selectedUser:', selectedUser);

    if (!selectedUser) {
      console.error('ERRORE: Nessun utente selezionato per l\'eliminazione');
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Nessun utente selezionato per l'eliminazione",
      });
      return;
    }

    try {
      console.log('Tentativo di eliminazione utente:', selectedUser.id);
      
      const response = await api.delete(`/admin/users/${selectedUser.id}`);
      console.log('Risposta server:', response);

      if (response.data.success) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
        
        toast({
          title: "Successo",
          description: "Utente eliminato con successo",
        });
      } else {
        throw new Error(response.data.message || 'Errore sconosciuto');
      }
    } catch (error: any) {
      console.error('Errore durante l\'eliminazione:', error);
      
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.response?.data?.message || error.message || "Errore durante l'eliminazione dell'utente",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div 
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Avatar e upload foto */}
                {/* ... (resto del codice dell'avatar come prima) ... */}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-500">Dashboard Admin</h1>
                <p className="text-zinc-400">Benvenuto, {user?.nome} {user?.cognome}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="text-zinc-200 hover:text-white hover:bg-zinc-800"
              onClick={() => logout()}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Clienti Totali"
            value={stats.totalUsers}
            icon={<Users className="h-6 w-6 text-amber-500" />}
            trend={`+${Math.round((stats.totalUsers / 100) * 5)}% questo mese`}
          />
          <StatsCard
            title="Prenotazioni Oggi"
            value={stats.todayBookings}
            icon={<Calendar className="h-6 w-6 text-amber-500" />}
            trend={`${stats.todayBookings > 10 ? '+' : '-'}${Math.abs(stats.todayBookings - 10)} rispetto a ieri`}
          />
          <StatsCard
            title="Servizi Attivi"
            value={stats.activeServices}
            icon={<Scissors className="h-6 w-6 text-amber-500" />}
            trend={`${services.length} servizi totali`}
          />
          <StatsCard
            title="Valutazione Media"
            value={stats.averageRating.toFixed(1)}
            icon={<Star className="h-6 w-6 text-amber-500" />}
            trend={`Basato su ${stats.totalBookings} recensioni`}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-zinc-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Utenti</TabsTrigger>
            <TabsTrigger value="bookings">Prenotazioni</TabsTrigger>
            <TabsTrigger value="services">Servizi</TabsTrigger>
            <TabsTrigger value="barbers">Barbieri</TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Utenti</CardTitle>
                <CardDescription>
                  Lista di tutti gli utenti registrati
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Data Registrazione</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={user.fotoProfilo ? `/uploads/${user.fotoProfilo}` : undefined} 
                              alt={`${user.nome} ${user.cognome}`} 
                            />
                            <AvatarFallback>
                              {user.nome[0]}{user.cognome[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.nome} {user.cognome}</span>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.ruolo}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('==========================================');
                              console.log('Click sul pulsante elimina utente');
                              console.log('Utente selezionato:', user);
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ... (resto dei tab contents) ... */}
        </Tabs>

        {/* Service Dialog */}
        <ServiceDialog
          open={serviceDialogOpen}
          onOpenChange={setServiceDialogOpen}
          service={selectedService}
          onSuccess={handleServiceSuccess}
        />

        {/* Delete User Dialog */}
        <AlertDialog 
          open={isDeleteDialogOpen} 
          onOpenChange={(open) => {
            console.log('Dialog stato cambiato:', open);
            setIsDeleteDialogOpen(open);
            if (!open) setSelectedUser(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUser ? 
                  `Questa azione non può essere annullata. L'utente ${selectedUser.nome} ${selectedUser.cognome} verrà eliminato permanentemente dal sistema.` :
                  'Errore: Nessun utente selezionato'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={() => {
                  console.log('Click su Conferma eliminazione');
                  handleDeleteUser();
                }}
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
}

function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-200">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}