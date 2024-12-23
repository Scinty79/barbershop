import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CheckCircle2, XCircle, Calendar, Clock, User, Scissors, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  success: boolean;
  date?: Date;
  time?: string;
  barbiereName?: string;
  services?: { nome: string; prezzo: number }[];
  error?: string;
  onConfirm: () => void;
}

export function BookingConfirmDialog({
  isOpen,
  onClose,
  success,
  date,
  time,
  barbiereName,
  services,
  error,
  onConfirm
}: BookingConfirmDialogProps) {
  console.log('BookingConfirmDialog props:', {
    isOpen,
    success,
    date,
    time,
    barbiereName,
    services,
    error
  });

  const totalAmount = services?.reduce((acc, service) => acc + service.prezzo, 0) || 0;

  if (!success && !error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center mb-2">
              Conferma prenotazione
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-500 dark:text-zinc-400">
              Verifica i dettagli del tuo appuntamento prima di confermare
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 space-y-4 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Calendar className="h-5 w-5 text-amber-500" />
                <p><span className="font-medium">Data:</span> {date && format(date, 'dd MMMM yyyy', { locale: it })}</p>
              </div>
              
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Clock className="h-5 w-5 text-amber-500" />
                <p><span className="font-medium">Ora:</span> {time}</p>
              </div>
              
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <User className="h-5 w-5 text-amber-500" />
                <p><span className="font-medium">Barbiere:</span> {barbiereName}</p>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Scissors className="h-5 w-5 text-amber-500" />
                  <p className="font-medium text-zinc-700 dark:text-zinc-200">Servizi:</p>
                </div>
                <ul className="space-y-2 pl-8">
                  {services?.map((service, index) => (
                    <li key={index} className="flex justify-between text-zinc-600 dark:text-zinc-300">
                      <span>{service.nome}</span>
                      <span className="font-medium">€{Number(service.prezzo).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">Totale:</span>
                  </div>
                  <span className="text-lg font-bold text-amber-500">€{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Modifica
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Conferma Prenotazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center justify-center gap-3 text-2xl pb-4",
            success ? "text-green-500" : "text-red-500"
          )}>
            {success ? (
              <>
                <CheckCircle2 className="h-8 w-8" />
                <span>Prenotazione Confermata!</span>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8" />
                <span>Errore Prenotazione</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {success ? (
              <div className="space-y-6">
                <p className="text-center text-zinc-500 dark:text-zinc-400">
                  La tua prenotazione è stata confermata con successo.
                </p>
                
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 space-y-4 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    <p><span className="font-medium">Data:</span> {date && format(date, 'dd MMMM yyyy', { locale: it })}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <p><span className="font-medium">Ora:</span> {time}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                    <User className="h-5 w-5 text-amber-500" />
                    <p><span className="font-medium">Barbiere:</span> {barbiereName}</p>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Scissors className="h-5 w-5 text-amber-500" />
                      <p className="font-medium text-zinc-700 dark:text-zinc-200">Servizi prenotati:</p>
                    </div>
                    <ul className="space-y-2 pl-8">
                      {services?.map((service, index) => (
                        <li key={index} className="flex justify-between text-zinc-600 dark:text-zinc-300">
                          <span>{service.nome}</span>
                          <span className="font-medium">€{Number(service.prezzo).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">Totale:</span>
                      </div>
                      <span className="text-lg font-bold text-amber-500">€{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400 mt-2 text-center">
                {error || 'Si è verificato un errore durante la prenotazione. Riprova più tardi.'}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button
            onClick={onClose}
            className={cn(
              "w-full text-white",
              success ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            )}
          >
            {success ? 'Chiudi' : 'Riprova'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
