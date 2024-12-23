import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from './ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { ChevronLeft, ChevronRight } from './ui/icons';
import { Loader2, Check, Clock } from "lucide-react";
import { mockBarbieri, mockServizi } from '../mocks/data';
import api from '../lib/api';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '../lib/logger';
import { BookingNotificationService } from '../lib/notifications/booking-notifications';

interface Barbiere {
  id: number;
  utente: {
    nome: string;
    cognome: string;
    fotoProfilo?: string;
  };
}

interface Servizio {
  id: number;
  nome: string;
  durata: number;
  prezzo: number;
}

interface BookingModalProps {
  showModal: boolean;
  onClose: () => void;
}

export function BookingModal({ showModal, onClose }: BookingModalProps) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [barbieri, setBarbieri] = useState<Barbiere[]>([]);
  const [serviziList, setServiziList] = useState<Servizio[]>([]);
  const [barbiere, setBarbiere] = useState<string>("");
  const [servizi, setServizi] = useState<string[]>([]);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [note, setNote] = useState<string>("");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (showModal) {
      fetchData();
    }
  }, [showModal]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Tentiamo di recuperare i dati dal server
      const [barbieriRes, serviziRes] = await Promise.all([
        api.get('/api/barbers').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/services').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (!barbieriRes.data?.success || !serviziRes.data?.success) {
        console.log('Server non disponibile, utilizzo dati mock');
        setBarbieri(mockBarbieri);
        setServiziList(mockServizi);
        toast({
          title: "Modalità Demo",
          description: "Stai visualizzando dati dimostrativi poiché il server non è disponibile",
          variant: "default",
        });
      } else {
        const barbieriData = barbieriRes.data.data.map((b: any) => ({
          id: b.id,
          utente: {
            nome: b.nome,
            cognome: b.cognome,
            fotoProfilo: b.fotoProfilo
          }
        }));
        setBarbieri(barbieriData);
        setServiziList(serviziRes.data.data);
      }
    } catch (error) {
      console.log('Errore nel recupero dei dati, utilizzo dati mock:', error);
      setBarbieri(mockBarbieri);
      setServiziList(mockServizi);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset degli stati quando il modal viene chiuso
  useEffect(() => {
    if (!showModal) {
      setBarbiere("");
      setServizi([]);
      setDate(undefined);
      setTime("");
      setAvailableTimes([]);
      setNote("");
    }
  }, [showModal]);

  // Carica orari disponibili quando viene selezionata una data e un barbiere
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!date || !barbiere || servizi.length === 0) {
        setAvailableTimes([]);
        return;
      }

      setIsLoading(true);
      try {
        // Calcola la durata totale dei servizi selezionati
        const durataServizi = serviziList
          .filter(s => servizi.includes(s.id.toString()))
          .reduce((total, s) => total + s.durata, 0);

        // Chiamata API per ottenere gli orari disponibili
        const response = await api.get('/api/bookings/available-times', {
          params: {
            barbiereId: barbiere,
            data: format(date, 'yyyy-MM-dd'),
            durata: durataServizi
          }
        });

        if (response.data.success) {
          setAvailableTimes(response.data.times);
        } else {
          throw new Error(response.data.message || 'Errore nel recupero degli orari');
        }

      } catch (error: any) {
        console.error('Errore nel recupero degli orari disponibili:', error);
        toast({
          title: "Errore",
          description: error.response?.data?.message || "Impossibile recuperare gli orari disponibili.",
          variant: "destructive",
        });
        setAvailableTimes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableTimes();
  }, [date, barbiere, servizi, serviziList]);

  const isFormValid = barbiere && servizi.length > 0 && date && time;

  const handleConfirmationOpen = () => {
    if (!isFormValid) return;
    setIsConfirmationOpen(true);
  };

  const handleBooking = async () => {
    if (!isFormValid) return;
    
    logger.info('Iniziando processo di prenotazione', {
      barbiereId: barbiere,
      servizi,
      data: date,
      ora: time
    });
    
    setIsLoading(true);
    try {
      const bookingData = {
        barbiereId: barbiere,
        servizi: servizi,
        data: format(date!, 'yyyy-MM-dd'),
        ora: time,
        note: note.trim(),
      };

      logger.debug('Dati prenotazione preparati', bookingData);

      // Effettua la chiamata API
      const response = await api.post('/api/bookings', bookingData);
      logger.debug('Risposta API prenotazione ricevuta', response.data);

      if (response.data.success) {
        // Prepara i dati per le notifiche
        const selectedBarber = barbieri.find(b => b.id.toString() === barbiere);
        const selectedServices = serviziList.filter(s => servizi.includes(s.id.toString()));
        const totalAmount = selectedServices.reduce((acc, s) => acc + s.prezzo, 0);

        const notificationData = {
          bookingId: response.data.bookingId,
          userId: user!.id,
          barberId: barbiere,
          date: date!,
          time: time,
          services: selectedServices,
          customerName: `${user!.nome} ${user!.cognome}`,
          barberName: `${selectedBarber?.utente.nome} ${selectedBarber?.utente.cognome}`,
          totalAmount
        };

        logger.info('Invio notifiche prenotazione', { bookingId: response.data.bookingId });
        
        // Invia tutte le notifiche
        const notificationResult = await BookingNotificationService.sendBookingNotifications(notificationData);
        
        if (!notificationResult.success) {
          const failedTypes = notificationResult.results
            .filter(r => !r.success)
            .map(r => {
              switch (r.type) {
                case 'push': return 'notifica push';
                case 'customerEmail': return 'email cliente';
                case 'barberEmail': return 'email barbiere';
                case 'realtime': return 'notifica real-time';
              }
            });
            
          logger.warn('Alcune notifiche non sono state inviate', { 
            bookingId: response.data.bookingId,
            failedTypes
          });
          
          // Mostra un toast di avviso ma non bloccare il flusso
          toast({
            title: "Prenotazione confermata con avviso",
            description: `La prenotazione è stata confermata ma alcune notifiche non sono state inviate (${failedTypes.join(', ')}).`,
            variant: "warning",
          });
        } else {
          toast({
            title: "Prenotazione confermata!",
            description: "Il tuo appuntamento è stato prenotato con successo.",
          });
        }
        
        // Chiudi entrambi i modal
        setIsConfirmationOpen(false);
        onClose();
        
        // Aggiorna la dashboard
        window.dispatchEvent(new CustomEvent('booking-created'));
        
        logger.info('Processo di prenotazione completato', {
          bookingId: response.data.bookingId,
          notificationsSuccess: notificationResult.success
        });
      } else {
        throw new Error(response.data.message || 'Errore durante la prenotazione');
      }
      
    } catch (error: any) {
      logger.error('Errore durante la prenotazione', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      console.error('Errore durante la prenotazione:', error);
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Si è verificato un errore durante la prenotazione. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={showModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[650px] h-[85vh] p-0">
          <div className="h-full flex flex-col">
            {/* Header con sfondo gradient */}
            <DialogHeader className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-t-lg">
              <DialogTitle className="text-2xl font-bold">
                Prenota un appuntamento
              </DialogTitle>
              <DialogDescription className="text-amber-100">
                Seleziona il barbiere, i servizi desiderati e scegli data e ora per il tuo appuntamento.
              </DialogDescription>
            </DialogHeader>

            {/* Contenuto scrollabile */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Selezione barbiere */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                  Scegli il tuo barbiere
                </label>
                <Select value={barbiere} onValueChange={setBarbiere}>
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-800">
                    <SelectValue placeholder="Seleziona un barbiere" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbieri && barbieri.length > 0 ? (
                      barbieri.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.utente?.nome} {b.utente?.cognome}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_no_barbers" disabled>
                        Nessun barbiere disponibile
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selezione servizi */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                  Seleziona i servizi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviziList && serviziList.length > 0 ? (
                    serviziList.map((servizio) => {
                      const isSelected = servizi.includes(servizio.id.toString());
                      return (
                        <button
                          key={servizio.id}
                          onClick={() => {
                            if (isSelected) {
                              setServizi(servizi.filter((s) => s !== servizio.id.toString()));
                            } else {
                              setServizi([...servizi, servizio.id.toString()]);
                            }
                          }}
                          className={`
                            w-full p-4 rounded-lg border text-left transition-all duration-200
                            ${isSelected 
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500 dark:ring-amber-400' 
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-medium ${isSelected ? 'text-amber-900 dark:text-amber-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {servizio.nome}
                              </h3>
                              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                                <span className={`font-medium ${isSelected ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                  €{servizio.prezzo}
                                </span>
                                <span>•</span>
                                <div className="flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {servizio.durata} min
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="text-amber-500 dark:text-amber-400">
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-zinc-500 col-span-2">Nessun servizio disponibile</p>
                  )}
                </div>
              </div>

              {/* Data e Ora */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendario */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                    Scegli la data
                  </label>
                  <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={it}
                      className="mx-auto"
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                      classNames={{
                        months: "flex flex-col space-y-4",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium text-amber-600 dark:text-amber-400",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-md inline-flex items-center justify-center",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-zinc-500 rounded-md w-8 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm relative [&:has([aria-selected])]:bg-amber-50 dark:[&:has([aria-selected])]:bg-amber-900/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-8 w-8 p-0 font-normal",
                        day_selected: "bg-amber-600 text-white hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white dark:bg-amber-500 dark:text-white",
                        day_today: "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-400",
                        day_outside: "text-zinc-400 opacity-50",
                        day_disabled: "text-zinc-400 opacity-50",
                        day_range_middle: "aria-selected:bg-amber-100 aria-selected:text-amber-900",
                        day_hidden: "invisible",
                      }}
                      components={{
                        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                      }}
                    />
                  </div>
                </div>

                {/* Orari */}
                <div className="space-y-3">
                  <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                    Scegli l'orario
                  </label>
                  {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                        <span>Caricamento orari disponibili...</span>
                      </div>
                    </div>
                  ) : date && barbiere && servizi.length > 0 ? (
                    availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        {availableTimes.map((t) => (
                          <Button
                            key={t}
                            variant={time === t ? "default" : "outline"}
                            className={cn(
                              "w-full",
                              time === t && "bg-amber-600 hover:bg-amber-700"
                            )}
                            onClick={() => setTime(t)}
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                        Nessun orario disponibile per la data selezionata
                      </div>
                    )
                  ) : (
                    <div className="h-[300px] flex items-center justify-center p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                      {!barbiere 
                        ? "Seleziona un barbiere per vedere gli orari disponibili"
                        : !servizi.length 
                          ? "Seleziona almeno un servizio"
                          : "Seleziona una data per vedere gli orari disponibili"
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                  Note aggiuntive
                </label>
                <Textarea
                  placeholder="Inserisci eventuali note o richieste particolari..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none bg-white dark:bg-zinc-800"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer fisso */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-lg">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="sm:w-auto"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleConfirmationOpen}
                  className="sm:w-auto bg-amber-600 hover:bg-amber-700"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    'Procedi'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal di conferma */}
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-amber-700 dark:text-amber-400">
              Conferma prenotazione
            </DialogTitle>
            <DialogDescription>
              Verifica i dettagli del tuo appuntamento prima di confermare
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-4 rounded-lg border border-amber-200 dark:border-amber-900/50 overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-400">Riepilogo appuntamento</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium text-zinc-500 dark:text-zinc-400">Data:</div>
                  <div className="col-span-2 font-medium">{date && format(date, 'dd MMMM yyyy', { locale: it })}</div>
                  
                  <div className="font-medium text-zinc-500 dark:text-zinc-400">Ora:</div>
                  <div className="col-span-2 font-medium">{time}</div>
                  
                  <div className="font-medium text-zinc-500 dark:text-zinc-400">Barbiere:</div>
                  <div className="col-span-2 font-medium">
                    {barbieri.find(b => b.id.toString() === barbiere)?.utente.nome} {barbieri.find(b => b.id.toString() === barbiere)?.utente.cognome}
                  </div>
                  
                  <div className="font-medium text-zinc-500 dark:text-zinc-400">Servizi:</div>
                  <div className="col-span-2">
                    {serviziList
                      .filter(s => servizi.includes(s.id.toString()))
                      .map((s, index, array) => (
                        <span key={s.id} className="font-medium">
                          {s.nome}{index < array.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    }
                  </div>
                  
                  {note && (
                    <>
                      <div className="font-medium text-zinc-500 dark:text-zinc-400">Note:</div>
                      <div className="col-span-2 font-medium">{note}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmationOpen(false)}
              className="w-full sm:w-auto"
            >
              Modifica
            </Button>
            <Button
              onClick={handleBooking}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confermo...
                </>
              ) : (
                'Conferma prenotazione'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}