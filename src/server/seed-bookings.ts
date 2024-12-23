import { PrismaClient } from '@prisma/client';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function createSampleBookings() {
  try {
    // Ottieni i barbieri esistenti
    const barbieri = await prisma.barbiere.findMany({
      include: {
        utente: true,
        servizi: {
          include: {
            servizio: true
          }
        }
      }
    });

    if (barbieri.length === 0) {
      console.log('Nessun barbiere trovato. Impossibile creare prenotazioni di esempio.');
      return;
    }

    // Ottieni un cliente esistente o creane uno nuovo
    let cliente = await prisma.utente.findFirst({
      where: {
        ruolo: 'CLIENTE'
      }
    });

    if (!cliente) {
      cliente = await prisma.utente.create({
        data: {
          email: 'cliente.test@example.com',
          password: '$2a$10$dJJ6YE.hbJmECWHqFRY1sOg6G9R2Z2CvGqZZQgQ2dZ8OF1mFxNEWq', // password: test123
          nome: 'Cliente',
          cognome: 'Test',
          ruolo: 'CLIENTE'
        }
      });
    }

    // Crea prenotazioni per i prossimi 7 giorni
    const orari = [9, 10, 11, 14, 15, 16, 17];
    const prenotazioni = [];

    for (let i = 0; i < 7; i++) {
      const giorno = addDays(new Date(), i);
      
      // Per ogni barbiere, crea alcune prenotazioni casuali
      for (const barbiere of barbieri) {
        // Scegli 2-3 orari casuali per ogni giorno
        const numPrenotazioni = Math.floor(Math.random() * 2) + 2;
        const orariGiorno = [...orari].sort(() => Math.random() - 0.5).slice(0, numPrenotazioni);

        for (const ora of orariGiorno) {
          const dataOra = setMinutes(setHours(giorno, ora), 0);
          
          // Scegli un servizio casuale del barbiere
          const serviziBarbiere = barbiere.servizi;
          if (serviziBarbiere.length === 0) continue;
          
          const servizioScelto = serviziBarbiere[Math.floor(Math.random() * serviziBarbiere.length)];

          prenotazioni.push({
            dataOra,
            stato: 'CONFERMATA',
            utenteId: cliente.id,
            barbiereId: barbiere.id,
            servizi: {
              create: {
                servizioId: servizioScelto.servizioId
              }
            }
          });
        }
      }
    }

    // Inserisci tutte le prenotazioni
    for (const prenotazione of prenotazioni) {
      await prisma.prenotazione.create({
        data: prenotazione
      });
    }

    console.log(`✅ Create ${prenotazioni.length} prenotazioni di esempio`);
  } catch (error) {
    console.error('Errore durante la creazione delle prenotazioni di esempio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seed
createSampleBookings();
