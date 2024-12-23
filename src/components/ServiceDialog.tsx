import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PlusCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ServiceCategories = {
  TAGLIO: 'TAGLIO',
  BARBA: 'BARBA',
  TRATTAMENTO: 'TRATTAMENTO',
  COLORAZIONE: 'COLORAZIONE',
  COMBO: 'COMBO'
} as const;

export type ServiceCategory = keyof typeof ServiceCategories;

export type Service = {
  id?: string;
  nome: string;
  descrizione: string;
  durata: number;
  prezzo: number;
  categoria: string;
};

const formSchema = z.object({
  nome: z.string()
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Solo lettere, numeri e spazi sono permessi'),
  descrizione: z.string()
    .min(10, 'La descrizione deve contenere almeno 10 caratteri')
    .max(500, 'La descrizione non può superare i 500 caratteri'),
  durata: z.number()
    .min(15, 'La durata minima è di 15 minuti')
    .max(240, 'La durata massima è di 240 minuti')
    .refine(val => val % 5 === 0, 'La durata deve essere un multiplo di 5 minuti'),
  prezzo: z.number()
    .min(0.5, 'Il prezzo minimo è di 0.50€')
    .max(1000, 'Il prezzo massimo è di 1000€')
    .refine(val => (val * 2) % 1 === 0, 'Il prezzo deve essere un multiplo di 0.50€'),
  categoria: z.string().min(1, 'Seleziona o crea una categoria')
});

type ServiceFormValues = z.infer<typeof formSchema>;

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
  onAddService: (service: Service) => Promise<any>;
  onUpdateService: (id: string, service: Service) => Promise<any>;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  onAddService,
  onUpdateService
}: ServiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(Object.values(ServiceCategories));

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: service?.nome || '',
      descrizione: service?.descrizione || '',
      durata: service?.durata || 30,
      prezzo: service?.prezzo || 0.5,
      categoria: service?.categoria || '',
    },
  });

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const formattedCategory = newCategory.trim().toUpperCase();
      if (!categories.includes(formattedCategory)) {
        setCategories([...categories, formattedCategory]);
        form.setValue('categoria', formattedCategory);
        setNewCategory('');
        setShowNewCategoryInput(false);
        toast.success('Nuova categoria aggiunta');
      } else {
        toast.error('Questa categoria esiste già');
      }
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      setIsLoading(true);
      
      // Normalizza i dati prima dell'invio
      const serviceData: Service = {
        nome: values.nome.trim(),
        descrizione: values.descrizione.trim(),
        prezzo: Number(values.prezzo.toFixed(2)),
        durata: Math.round(values.durata / 5) * 5,
        categoria: values.categoria
      };

      if (service?.id) {
        await onUpdateService(service.id, serviceData);
        toast.success('Servizio aggiornato con successo', {
          className: 'bg-zinc-800 text-white'
        });
      } else {
        await onAddService(serviceData);
        toast.success('Servizio creato con successo', {
          className: 'bg-zinc-800 text-white'
        });
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Errore:', error);
      
      let errorMessage = 'Si è verificato un errore durante il salvataggio';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'Dati non validi. Verifica tutti i campi.';
            break;
          case 409:
            errorMessage = 'Esiste già un servizio con questo nome.';
            break;
          case 500:
            errorMessage = 'Errore del server. Riprova più tardi.';
            break;
          default:
            errorMessage = 'Si è verificato un errore imprevisto.';
        }
      }
      
      toast.error(errorMessage, {
        className: 'bg-red-900 text-white'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900/95 border-zinc-800">
        <DialogHeader className="space-y-3 pb-4 border-b border-zinc-800">
          <DialogTitle className="text-2xl font-semibold text-amber-500">
            {service ? 'Modifica servizio' : 'Nuovo servizio'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {service
              ? 'Modifica i dettagli del servizio esistente'
              : 'Inserisci i dettagli per creare un nuovo servizio'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">
                    Nome servizio <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="es. Taglio Classico" 
                      className="bg-zinc-800/50 border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">
                    Categoria <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="space-y-2">
                    {!showNewCategoryInput ? (
                      <>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-700 focus:ring-amber-500/20">
                            <SelectValue placeholder="Seleziona una categoria" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {categories.map((category) => (
                              <SelectItem 
                                key={category} 
                                value={category} 
                                className="focus:bg-amber-500/20"
                              >
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                          onClick={() => setShowNewCategoryInput(true)}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Aggiungi nuova categoria
                        </Button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Nuova categoria..."
                          className="bg-zinc-800/50 border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                        <Button
                          type="button"
                          onClick={handleAddCategory}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Aggiungi
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategory('');
                          }}
                          className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                        >
                          Annulla
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormDescription className="text-xs text-zinc-500">
                    Seleziona una categoria esistente o creane una nuova
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">
                    Descrizione <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descrivi il servizio in dettaglio..." 
                      className="bg-zinc-800/50 border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20 min-h-[120px] resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="durata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-zinc-200">
                      Durata (min) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min="15" 
                          max="240"
                          step="5"
                          {...field} 
                          className="bg-zinc-800/50 border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20 pl-4 pr-12"
                          placeholder="30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                          min
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-zinc-500">
                      Multipli di 5 minuti (15-240)
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prezzo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-zinc-200">
                      Prezzo <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min="0" 
                          max="1000"
                          step="0.50"
                          {...field} 
                          className="bg-zinc-800/50 border-zinc-700 focus:border-amber-500 focus:ring-amber-500/20 pl-7 pr-4"
                          placeholder="25.50"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                          €
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-zinc-500">
                      Multipli di 0.50€ (0-1000€)
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-3 pt-4 border-t border-zinc-800">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {service?.id ? 'Aggiornamento...' : 'Creazione...'}
                  </>
                ) : (
                  service?.id ? 'Aggiorna servizio' : 'Crea servizio'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
