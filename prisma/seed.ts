import { PrismaClient, RuoloUtente, CategoriaServizio } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Pulisci il database
  await prisma.prenotazioneServizio.deleteMany();
  await prisma.prenotazione.deleteMany();
  await prisma.serviziBarbiere.deleteMany();
  await prisma.servizio.deleteMany();
  await prisma.orarioLavoro.deleteMany();
  await prisma.recensione.deleteMany();
  await prisma.chiusura.deleteMany();
  await prisma.barbiere.deleteMany();
  await prisma.tokenReset.deleteMany();
  await prisma.utente.deleteMany();

  // Crea admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.utente.create({
    data: {
      email: 'admin@barbershop.it',
      password: adminPassword,
      nome: 'Admin',
      cognome: 'Sistema',
      telefono: '+39 123 456 7890',
      ruolo: RuoloUtente.ADMIN,
    },
  });

  // Crea barbieri
  const barbierePassword = await bcrypt.hash('barbiere123', 10);
  const barbiere1 = await prisma.utente.create({
    data: {
      email: 'mario.rossi@barbershop.it',
      password: barbierePassword,
      nome: 'Mario',
      cognome: 'Rossi',
      ruolo: RuoloUtente.BARBIERE,
      barbiere: {
        create: {
          specialita: JSON.stringify(['Taglio classico', 'Barba']),
          descrizione: 'Specializzato in tagli classici e cura della barba',
        },
      },
    },
  });

  const barbiere2 = await prisma.utente.create({
    data: {
      email: 'luca.bianchi@barbershop.it',
      password: barbierePassword,
      nome: 'Luca',
      cognome: 'Bianchi',
      ruolo: RuoloUtente.BARBIERE,
      barbiere: {
        create: {
          specialita: JSON.stringify(['Taglio moderno', 'Colorazione']),
          descrizione: 'Esperto in tagli moderni e colorazioni',
        },
      },
    },
  });

  // Crea servizi
  const servizi = await Promise.all([
    prisma.servizio.create({
      data: {
        nome: 'Taglio Classico',
        descrizione: 'Taglio classico con forbici e sfumatura',
        durata: 30,
        prezzo: 25.00,
        categoria: CategoriaServizio.TAGLIO,
      },
    }),
    prisma.servizio.create({
      data: {
        nome: 'Barba Completa',
        descrizione: 'Sistemazione barba con rasoio e finiture',
        durata: 30,
        prezzo: 20.00,
        categoria: CategoriaServizio.BARBA,
      },
    }),
    prisma.servizio.create({
      data: {
        nome: 'Taglio + Barba',
        descrizione: 'Combinazione di taglio classico e sistemazione barba',
        durata: 60,
        prezzo: 40.00,
        categoria: CategoriaServizio.COMBO,
      },
    }),
    prisma.servizio.create({
      data: {
        nome: 'Colorazione',
        descrizione: 'Colorazione professionale',
        durata: 90,
        prezzo: 50.00,
        categoria: CategoriaServizio.COLORAZIONE,
      },
    }),
  ]);

  // Associa servizi ai barbieri
  await Promise.all(
    servizi.map(async (servizio) => {
      const barbieri = await prisma.barbiere.findMany();
      return Promise.all(
        barbieri.map((barbiere) =>
          prisma.serviziBarbiere.create({
            data: {
              barbiereId: barbiere.id,
              servizioId: servizio.id,
            },
          })
        )
      );
    })
  );

  // Crea orari di lavoro per i barbieri
  const barbieri = await prisma.barbiere.findMany();
  const giorniLavorativi = [1, 2, 3, 4, 5, 6]; // Lunedì a Sabato

  await Promise.all(
    barbieri.map((barbiere) =>
      Promise.all(
        giorniLavorativi.map((giorno) =>
          prisma.orarioLavoro.create({
            data: {
              barbiereId: barbiere.id,
              giorno,
              oraInizio: '09:00',
              oraFine: '18:00',
            },
          })
        )
      )
    )
  );

  // Crea alcuni clienti di esempio
  const clientePassword = await bcrypt.hash('cliente123', 10);
  const cliente1 = await prisma.utente.create({
    data: {
      email: 'cliente1@example.com',
      password: clientePassword,
      nome: 'Paolo',
      cognome: 'Verdi',
      ruolo: RuoloUtente.CLIENTE,
    },
  });

  const cliente2 = await prisma.utente.create({
    data: {
      email: 'cliente2@example.com',
      password: clientePassword,
      nome: 'Anna',
      cognome: 'Neri',
      ruolo: RuoloUtente.CLIENTE,
    },
  });

  console.log('Database popolato con successo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
