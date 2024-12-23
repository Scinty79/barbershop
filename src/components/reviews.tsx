import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: 'Marco B.',
    rating: 5,
    date: '15 Marzo 2024',
    comment: 'Servizio eccellente! Il taglio è esattamente come lo volevo e l\'ambiente è molto accogliente.',
    service: 'Taglio + Barba',
  },
  {
    id: 2,
    name: 'Luca R.',
    rating: 5,
    date: '10 Marzo 2024',
    comment: 'Professionalità al top. Ambiente moderno e personale preparato.',
    service: 'Pacchetto VIP',
  },
  {
    id: 3,
    name: 'Alessandro M.',
    rating: 4,
    date: '5 Marzo 2024',
    comment: 'Ottima esperienza, tornerò sicuramente!',
    service: 'Taglio Classico',
  },
  {
    id: 4,
    name: 'Giovanni P.',
    rating: 5,
    date: '1 Marzo 2024',
    comment: 'Finalmente ho trovato il mio barbiere di fiducia. Consigliatissimo!',
    service: 'Barba Luxury',
  },
];

export function Reviews() {
  return (
    <section className="py-16 bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cosa Dicono i Nostri Clienti
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Le recensioni dei nostri clienti soddisfatti testimoniano la qualità del nostro servizio
            e la professionalità del nostro team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-800/50 rounded-lg p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{review.name}</h3>
                  <p className="text-sm text-zinc-400">{review.date}</p>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-zinc-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-zinc-300 mb-4">{review.comment}</p>
              
              <div className="flex items-center text-sm text-zinc-400">
                <span className="px-2 py-1 bg-zinc-700/50 rounded">
                  {review.service}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <button className="inline-flex items-center justify-center px-6 py-3 border border-amber-500 text-amber-500 rounded-lg hover:bg-amber-500/10 transition-colors">
            Vedi Tutte le Recensioni
          </button>
        </motion.div>
      </div>
    </section>
  );
}
