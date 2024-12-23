import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/use-toast';
import { auth } from '@/lib/auth';
import { ImageUpload } from './ui/image-upload';
import { User } from 'lucide-react';
import { WelcomeModal } from './WelcomeModal'; // Importazione corretta con named export

const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  nome: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve essere di almeno 2 caratteri'),
  telefono: z.string().regex(/^\+?[0-9]{10,}$/, 'Inserisci un numero di telefono valido'),
  fotoProfilo: z.any().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('nome', data.nome);
      formData.append('cognome', data.cognome);
      formData.append('telefono', data.telefono);
      
      const fileInput = document.querySelector<HTMLInputElement>('#avatar-upload');
      const file = fileInput?.files?.[0];
      if (file) {
        formData.append('photo', file); 
      }

      const response = await auth.register(formData);
      console.log('Registration response:', response);

      if (response.success) {
        // Salva il token per l'autenticazione
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Aggiorna l'header di autorizzazione per axios
          auth.setAuthToken(response.data.token);
          // Salva anche i dati dell'utente
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Mostra il modal di benvenuto
        setShowWelcomeModal(true);
        
        // Chiudi il modal di registrazione
        onSuccess();

        // Dopo 3 secondi, chiudi il modal di benvenuto e reindirizza
        setTimeout(() => {
          setShowWelcomeModal(false);
          navigate('/client-dashboard', { replace: true });
        }, 3000);
      } else {
        // Mostra l'errore specifico restituito dal server
        toast({
          variant: "destructive",
          title: "Errore di registrazione",
          description: response.error || "Si è verificato un errore durante la registrazione",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Si è verificato un errore durante la registrazione. Riprova più tardi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <ImageUpload
            value={avatarPreview}
            onChange={(file) => {
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setAvatarPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
                register('fotoProfilo').onChange({ target: { files: [file] } });
              } else {
                setAvatarPreview(null);
                register('fotoProfilo').onChange({ target: { files: [] } });
              }
            }}
            onError={(error) => {
              toast({
                variant: 'destructive',
                title: 'Errore',
                description: error,
              });
            }}
          />
          <p className="text-sm text-zinc-500">Carica una foto profilo (opzionale)</p>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium text-zinc-200">
              Nome
            </label>
            <input
              {...register('nome')}
              type="text"
              className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Mario"
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="cognome" className="text-sm font-medium text-zinc-200">
              Cognome
            </label>
            <input
              {...register('cognome')}
              type="text"
              className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Rossi"
            />
            {errors.cognome && (
              <p className="text-sm text-red-500">{errors.cognome.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-200">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="mario.rossi@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-200">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="telefono" className="text-sm font-medium text-zinc-200">
              Telefono
            </label>
            <input
              {...register('telefono')}
              type="tel"
              id="telefono"
              placeholder="+39 123 456 7890"
              className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-zinc-800/50 
                      focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {errors.telefono && (
              <p className="text-sm text-red-500">{errors.telefono.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 px-4 py-3 rounded-md bg-amber-600 text-white font-medium
                 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Registrazione in corso...</span>
            </div>
          ) : (
            'Registrati'
          )}
        </button>
      </form>

      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userRole="CLIENTE"
      />
    </>
  );
}
