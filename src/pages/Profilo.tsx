import { motion } from 'framer-motion';
import { User, Calendar, Star, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';

export default function Profilo() {
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logout effettuato",
      description: "Arrivederci! Stai per essere reindirizzato...",
      duration: 3000,
    });
    
    setTimeout(() => {
      logout();
    }, 3000);
  };

  // Dati di esempio (in un'app reale verrebbero dal backend)
  const utente = {
    nome: 'Mario Rossi',
    email: 'mario.rossi@email.com',
    punti: 150,
    appuntamenti: [
      {
        data: '2024-03-20',
        ora: '14:30',
        servizio: 'Taglio + Barba',
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header Profilo */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{utente.nome}</h1>
          <p className="text-zinc-400 mb-4">{utente.email}</p>
          
          {/* Pulsante Logout */}
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Grid di Sezioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prossimo Appuntamento */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-amber-500 mr-2" />
              <h2 className="text-xl font-semibold">Prossimo Appuntamento</h2>
            </div>
            {utente.appuntamenti.length > 0 ? (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="font-medium">{utente.appuntamenti[0].servizio}</div>
                <div className="text-zinc-400">
                  {utente.appuntamenti[0].data} alle {utente.appuntamenti[0].ora}
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  Modifica Appuntamento
                </Button>
              </div>
            ) : (
              <p className="text-zinc-400">Nessun appuntamento programmato</p>
            )}
          </motion.div>

          {/* Punti Fedeltà */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Star className="w-5 h-5 text-amber-500 mr-2" />
              <h2 className="text-xl font-semibold">Punti Fedeltà</h2>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-500 mb-2">
                {utente.punti}
              </div>
              <p className="text-zinc-400 mb-4">punti accumulati</p>
              <Button variant="default" className="w-full">
                Vedi Dettagli
              </Button>
            </div>
          </motion.div>

          {/* Impostazioni */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-lg p-6 md:col-span-2"
          >
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-amber-500 mr-2" />
              <h2 className="text-xl font-semibold">Impostazioni</h2>
            </div>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Modifica Profilo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Preferenze Notifiche
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
