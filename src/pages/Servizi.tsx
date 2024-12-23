import { motion } from 'framer-motion';
import { Scissors, Clock } from 'lucide-react';

const servizi = [
  {
    nome: 'Taglio Classico',
    descrizione: 'Taglio tradizionale con finish styling',
    durata: '30 min',
    prezzo: '25€',
    punti: 10,
  },
  {
    nome: 'Taglio + Barba',
    descrizione: 'Taglio completo con rifinitura barba',
    durata: '45 min',
    prezzo: '35€',
    punti: 15,
  },
  {
    nome: 'Barba Luxury',
    descrizione: 'Trattamento barba completo con prodotti premium',
    durata: '30 min',
    prezzo: '20€',
    punti: 8,
  },
  {
    nome: 'Hair Styling',
    descrizione: 'Styling personalizzato con prodotti professionali',
    durata: '20 min',
    prezzo: '15€',
    punti: 5,
  },
  {
    nome: 'Pacchetto VIP',
    descrizione: 'Taglio, barba e trattamento luxury completo',
    durata: '75 min',
    prezzo: '60€',
    punti: 25,
  },
  {
    nome: 'Shampoo & Massage',
    descrizione: 'Lavaggio con massaggio rilassante',
    durata: '20 min',
    prezzo: '15€',
    punti: 5,
  },
];

export default function Servizi() {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">I Nostri Servizi</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Scopri la nostra gamma completa di servizi professionali per la cura dei capelli e della barba.
            Ogni servizio include prodotti premium e l'expertise dei nostri barbieri qualificati.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servizi.map((servizio, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900/50 rounded-lg p-6 backdrop-blur-sm hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{servizio.nome}</h3>
                  <p className="text-zinc-400 text-sm">{servizio.descrizione}</p>
                </div>
                <div className="bg-amber-500/10 text-amber-500 p-2 rounded-full">
                  <Scissors className="h-5 w-5" />
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center text-zinc-300">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{servizio.durata}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-500">{servizio.prezzo}</span>
                  <span className="text-sm text-zinc-400">+{servizio.punti} punti</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
