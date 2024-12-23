import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email obbligatoria')
    .email('Email non valida')
    .transform(val => val.toLowerCase()),
  password: z
    .string()
    .min(1, 'Password obbligatoria')
    .min(6, 'La password deve essere di almeno 6 caratteri')
    .max(50, 'La password non può superare i 50 caratteri'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ onSuccess, onChangeModal }: { onSuccess: () => void, onChangeModal: (modal: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading || isAuthLoading) return;
    
    setIsLoading(true);
    try {
      // Effettua il login e ottieni i dati dell'utente
      const authData = await login(data.email, data.password);
      
      if (!authData || !authData.user) {
        throw new Error('Dati di autenticazione non validi');
      }

      // 1. Chiudiamo il modal
      onSuccess();

      // 2. Reindirizza alla dashboard appropriata con lo state
      const dashboardPath = authData.user.ruolo === 'ADMIN' ? '/admin/dashboard' : '/client-dashboard';
      
      // Aspetta un momento prima di navigare per assicurarsi che l'autenticazione sia completa
      setTimeout(() => {
        navigate(dashboardPath, { 
          replace: true,
          state: { 
            showWelcome: true,
            timestamp: Date.now()
          }
        });
      }, 100);
      
    } catch (error) {
      console.error('Errore durante il login:', error);
      let errorMessage = 'Si è verificato un errore durante il login';
      
      if (error instanceof Error) {
        switch (error.message) {
          case 'INVALID_CREDENTIALS':
            errorMessage = 'Credenziali non valide';
            break;
          case 'USER_NOT_FOUND':
            errorMessage = 'Utente non trovato';
            break;
          case 'ACCOUNT_DISABLED':
            errorMessage = 'Account disabilitato';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-200">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className={`w-full px-3 py-2 rounded-md border ${
              errors.email ? 'border-red-500' : 'border-zinc-700'
            } bg-zinc-800/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors`}
            placeholder="mario.rossi@email.com"
            disabled={isLoading || isAuthLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-200">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            className={`w-full px-3 py-2 rounded-md border ${
              errors.password ? 'border-red-500' : 'border-zinc-700'
            } bg-zinc-800/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors`}
            placeholder="••••••••"
            disabled={isLoading || isAuthLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || isAuthLoading}
        className={`w-full px-4 py-3 rounded-md bg-amber-600 text-white font-medium 
          hover:bg-amber-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
        `}
      >
        {(isLoading || isAuthLoading) ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Accesso in corso...</span>
          </div>
        ) : (
          'Accedi'
        )}
      </button>
    </form>
  );
}