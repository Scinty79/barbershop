import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface BarberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber?: any;
  onSuccess: () => Promise<void>;
}

export default function BarberDialog({
  open,
  onOpenChange,
  barber,
  onSuccess,
}: BarberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [biografia, setBiografia] = useState('');
  const [specializzazioni, setSpecializzazioni] = useState('');
  const [orarioInizio, setOrarioInizio] = useState('09:00');
  const [orarioFine, setOrarioFine] = useState('18:00');
  const [giorniLavoro, setGiorniLavoro] = useState<string[]>(['1', '2', '3', '4', '5', '6']); // 0 = domenica, 1 = lunedì, ecc.
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (barber) {
      setNome(barber.utente.nome || '');
      setCognome(barber.utente.cognome || '');
      setEmail(barber.utente.email || '');
      setTelefono(barber.telefono || '');
      setBiografia(barber.biografia || '');
      setSpecializzazioni(barber.specializzazioni || '');
      setOrarioInizio(barber.orarioInizio || '09:00');
      setOrarioFine(barber.orarioFine || '18:00');
      setGiorniLavoro(barber.giorniLavoro || ['1', '2', '3', '4', '5', '6']);
      if (barber.utente.fotoProfilo) {
        setFotoPreview(`${import.meta.env.VITE_API_URL}/uploads/${barber.utente.fotoProfilo}`);
      }
    } else {
      setNome('');
      setCognome('');
      setEmail('');
      setTelefono('');
      setBiografia('');
      setSpecializzazioni('');
      setOrarioInizio('09:00');
      setOrarioFine('18:00');
      setGiorniLavoro(['1', '2', '3', '4', '5', '6']);
      setFoto(null);
      setFotoPreview('');
    }
  }, [barber]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepara i dati nel formato corretto
      const orariLavoro = giorniLavoro.map(giorno => ({
        giorno: parseInt(giorno),
        oraInizio: orarioInizio,
        oraFine: orarioFine
      }));

      const barberData = {
        utenteId: barber?.utente?.id || '',
        specialita: specializzazioni.split(',').map(s => s.trim()),
        descrizione: biografia,
        orariLavoro: orariLavoro
      };

      if (barber) {
        // Logica di update (da implementare)
        await api.put(`/api/barbieri/${barber.id}`, barberData);
        toast({
          title: 'Successo',
          description: 'Barbiere aggiornato con successo!',
        });
      } else {
        // Creazione nuovo barbiere
        await api.post('/api/admin/barbers', barberData);
        toast({
          title: 'Successo',
          description: 'Barbiere creato con successo!',
        });
      }

      // Se c'è una foto da caricare, fallo in una chiamata separata
      if (foto) {
        const formData = new FormData();
        formData.append('foto', foto);
        formData.append('barbiereId', barber?.id || '');
        await api.post('/api/admin/barbers/upload-photo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      await onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Errore:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante il salvataggio del barbiere',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const giorni = [
    { value: '0', label: 'Domenica' },
    { value: '1', label: 'Lunedì' },
    { value: '2', label: 'Martedì' },
    { value: '3', label: 'Mercoledì' },
    { value: '4', label: 'Giovedì' },
    { value: '5', label: 'Venerdì' },
    { value: '6', label: 'Sabato' },
  ];

  const orari = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return [
      `${hour}:00`,
      `${hour}:30`,
    ];
  }).flat();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{barber ? 'Modifica Barbiere' : 'Nuovo Barbiere'}</DialogTitle>
          <DialogDescription>
            {barber ? 'Modifica i dettagli del barbiere esistente.' : 'Inserisci i dettagli per creare un nuovo barbiere.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto profilo */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={fotoPreview} />
              <AvatarFallback>
                {nome && cognome ? `${nome[0]}${cognome[0]}` : 'BB'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="w-auto"
              />
            </div>
          </div>

          {/* Dati personali */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cognome">Cognome</Label>
              <Input
                id="cognome"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Biografia e specializzazioni */}
          <div className="space-y-2">
            <Label htmlFor="biografia">Biografia</Label>
            <Textarea
              id="biografia"
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              placeholder="Inserisci una breve biografia..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specializzazioni">Specializzazioni</Label>
            <Textarea
              id="specializzazioni"
              value={specializzazioni}
              onChange={(e) => setSpecializzazioni(e.target.value)}
              placeholder="Inserisci le specializzazioni..."
            />
          </div>

          {/* Orari e giorni di lavoro */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orario di inizio</Label>
              <Select value={orarioInizio} onValueChange={setOrarioInizio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {orari.map((ora) => (
                    <SelectItem key={ora} value={ora}>
                      {ora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orario di fine</Label>
              <Select value={orarioFine} onValueChange={setOrarioFine}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {orari.map((ora) => (
                    <SelectItem key={ora} value={ora}>
                      {ora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Giorni lavorativi</Label>
            <div className="grid grid-cols-2 gap-2">
              {giorni.map((giorno) => (
                <label
                  key={giorno.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={giorniLavoro.includes(giorno.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGiorniLavoro([...giorniLavoro, giorno.value]);
                      } else {
                        setGiorniLavoro(
                          giorniLavoro.filter((g) => g !== giorno.value)
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>{giorno.label}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
