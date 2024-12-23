import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';

export default function Punti() {
  // Esempio di punti (in un'applicazione reale verrebbero dal backend)
  const punti = {
    totale: 150,
    storico: [
      { data: '2024-03-15', punti: 10, servizio: 'Taglio Capelli' },
      { data: '2024-03-01', punti: 15, servizio: 'Taglio + Barba' },
      { data: '2024-02-15', punti: 10, servizio: 'Taglio Capelli' },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 mb-4">
            <StarIcon className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">I tuoi Punti Fedeltà</h1>
          <div className="text-6xl font-bold text-amber-500 mb-2">{punti.totale}</div>
          <p className="text-zinc-400">punti accumulati</p>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Storico Punti</h2>
          <div className="space-y-4">
            {punti.storico.map((record, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50"
              >
                <div>
                  <div className="font-medium">{record.servizio}</div>
                  <div className="text-sm text-zinc-400">{record.data}</div>
                </div>
                <div className="flex items-center text-amber-500">
                  <StarIcon className="h-4 w-4 mr-1" />
                  <span>+{record.punti}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 bg-zinc-900/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Come Funziona</h2>
          <ul className="space-y-3 text-zinc-300">
            <li className="flex items-start">
              <StarIcon className="h-5 w-5 text-amber-500 mr-2 mt-1 flex-shrink-0" />
              <span>Guadagna 10 punti per ogni taglio</span>
            </li>
            <li className="flex items-start">
              <StarIcon className="h-5 w-5 text-amber-500 mr-2 mt-1 flex-shrink-0" />
              <span>15 punti per servizi combinati</span>
            </li>
            <li className="flex items-start">
              <StarIcon className="h-5 w-5 text-amber-500 mr-2 mt-1 flex-shrink-0" />
              <span>Raggiungi 200 punti per un taglio gratuito</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
