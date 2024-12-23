import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useToast } from './ui/use-toast';
import api from '@/lib/api';
import BarberDialog from './BarberDialog';

export default function BarbersManagement() {
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchBarbieri = async () => {
    try {
      const response = await api.get('/api/barbieri');
      console.log('Dati barbieri ricevuti:', response.data);
      if (response.data.success) {
        setBarbieri(response.data.data);
      } else {
        throw new Error(response.data.error || 'Errore nel caricamento dei barbieri');
      }
    } catch (error: any) {
      console.error('Errore completo:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description:
          error.response?.data?.error ||
          'Errore durante il caricamento dei barbieri',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbieri();
  }, []);

  const handleEdit = (barber: any) => {
    setSelectedBarber(barber);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBarber) return;

    try {
      await api.delete(`/api/barbieri/${selectedBarber.id}`);
      toast({
        title: 'Barbiere eliminato',
        description: 'Il barbiere è stato eliminato con successo',
      });
      await fetchBarbieri();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description:
          error.response?.data?.error ||
          'Errore durante l\'eliminazione del barbiere',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedBarber(null);
    }
  };

  const handleAdd = () => {
    setSelectedBarber(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle>Gestione Barbieri</CardTitle>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Barbiere
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barbieri.map((barber) => (
            <Card key={barber.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={
                        barber.utente?.fotoProfilo
                          ? `${import.meta.env.VITE_API_URL}/uploads/${barber.utente.fotoProfilo}`
                          : undefined
                      }
                      alt={`${barber.utente?.nome || ''} ${barber.utente?.cognome || ''}`}
                    />
                    <AvatarFallback>
                      {(barber.utente?.nome?.[0] || '') + (barber.utente?.cognome?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-center">
                    {barber.utente ? (
                      <>
                        <h3 className="font-semibold">
                          {barber.utente.nome} {barber.utente.cognome}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {barber.utente.email}
                        </p>
                        {barber.utente.telefono && (
                          <p className="text-sm text-muted-foreground">
                            {barber.utente.telefono}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Dati utente non disponibili</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(barber)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedBarber(barber);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      <BarberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        barber={selectedBarber}
        onSuccess={fetchBarbieri}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il barbiere verrà eliminato
              permanentemente dal sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
