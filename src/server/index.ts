import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import './express-server';
import multer from 'multer';
import path from 'path';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// Configurazione CORS
await fastify.register(cors, {
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Aggiungi questo per il parsing del body JSON
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body as string);
    done(null, json);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// Configurazione CORS e Multipart
async function configureServer() {
  try {
    // CORS
    await fastify.register(cors, {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Multipart
    await fastify.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
      }
    });

    console.log('✅ Server configurato con successo');
    return true;
  } catch (error) {
    console.error('❌ Errore configurazione server:', error);
    return false;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Schema di validazione per la registrazione
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  nome: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve essere di almeno 2 caratteri'),
  telefono: z.string().regex(/^\+?[0-9]{10,}$/, 'Inserisci un numero di telefono valido'),
});

// Schema di validazione per il login
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password non valida'),
});

// Schema di validazione per i servizi
const serviceSchema = z.object({
  nome: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
  descrizione: z.string().min(10, 'La descrizione deve essere di almeno 10 caratteri'),
  durata: z.number().min(15, 'La durata minima è di 15 minuti'),
  prezzo: z.number().min(0, 'Il prezzo non può essere negativo'),
  categoria: z.enum(['TAGLIO', 'BARBA', 'TRATTAMENTO', 'COLORAZIONE', 'COMBO']),
});

const formData = new FormData();
formData.append('email', data.email);
formData.append('password', data.password);
formData.append('nome', data.nome);
formData.append('cognome', data.cognome);
formData.append('telefono', data.telefono);

// Middleware per verificare il token JWT
const authMiddleware = async (request: any, reply: any) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Token non fornito');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.utente.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    request.user = user;
  } catch (error) {
    reply.status(401).send({ success: false, error: 'Non autorizzato' });
  }
};

// Middleware per verificare il ruolo admin
const adminMiddleware = async (request: any, reply: any) => {
  try {
    await authMiddleware(request, reply);
    if (request.user.ruolo !== 'ADMIN') {
      throw new Error('Accesso non autorizzato');
    }
  } catch (error) {
    reply.status(403).send({ success: false, error: 'Accesso non autorizzato' });
  }
};

// Configurazione multer per l'upload dei file
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Route per la registrazione
fastify.post('/api/auth/register', async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: 'Nessun dato ricevuto',
      });
    }

    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(data.fields)) {
      fields[key] = value.value;
    }

    const validatedData = registerSchema.parse({
      email: fields.email,
      password: fields.password,
      nome: fields.nome,
      cognome: fields.cognome,
      telefono: fields.telefono,
    });

    // Verifica se l'email esiste già
    const existingUser = await prisma.utente.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        error: 'Email già registrata',
      });
    }

    // Gestione dell'immagine del profilo
    let fotoProfilo = null;
    if (data.file) {
      // Crea la directory per le immagini se non esiste
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const filename = `${Date.now()}-${data.filename}`;
      const filepath = join(uploadDir, filename);
      
      await pipeline(data.file, createWriteStream(filepath));
      fotoProfilo = `/uploads/${filename}`;
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Crea nuovo utente
    const user = await prisma.utente.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        nome: validatedData.nome,
        cognome: validatedData.cognome,
        telefono: validatedData.telefono,
        fotoProfilo,
        ruolo: 'CLIENTE',
      },
    });

    // Genera token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    return reply.send({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Errore interno del server',
    });
  }
});

// Route per ottenere l'utente corrente
fastify.get('/api/auth/me', { preHandler: [authMiddleware] }, async (request: any, reply) => {
  const { password, ...userWithoutPassword } = request.user;
  return reply.send({
    success: true,
    data: userWithoutPassword,
  });
});

// Route per ottenere tutti gli utenti (solo admin)
fastify.get('/api/admin/users', { preHandler: [adminMiddleware] }, async (request, reply) => {
  try {
    const users = await prisma.utente.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return reply.send({
      success: true,
      data: usersWithoutPasswords,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Errore nel recupero degli utenti',
    });
  }
});

// Route per ottenere tutte le prenotazioni (solo admin)
fastify.get('/api/admin/bookings', { preHandler: [adminMiddleware] }, async (request, reply) => {
  try {
    const bookings = await prisma.prenotazione.findMany({
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
            telefono: true
          }
        },
        servizioPrenotazione: {
          include: {
            servizio: true
          }
        }
      },
      orderBy: {
        dataOra: 'desc'
      }
    });

    return reply.send({
      success: true,
      data: bookings.map(booking => ({
        ...booking,
        servizi: booking.servizioPrenotazione.map(sp => sp.servizio)
      }))
    });
  } catch (error) {
    console.error('Errore nel recupero delle prenotazioni:', error);
    return reply.status(500).send({
      success: false,
      error: 'Errore nel recupero delle prenotazioni'
    });
  }
});

// Route per ottenere le statistiche (solo admin)
fastify.get('/api/admin/stats', { preHandler: [adminMiddleware] }, async (request, reply) => {
  try {
    // Otteniamo i conteggi base in modo sicuro
    const baseStats = await Promise.all([
      prisma.utente.count({
        where: { ruolo: { not: 'ADMIN' } }
      }),
      prisma.prenotazione.count(),
      prisma.servizio.count({
        where: { attivo: true }
      })
    ]).catch(error => {
      console.error('Errore nel recupero dei conteggi base:', error);
      throw new Error('Errore nel recupero delle statistiche di base');
    });

    const [totalUsers, totalBookings, activeServices] = baseStats;

    // Recuperiamo le prenotazioni completate in modo sicuro
    const completedBookings = await prisma.prenotazione.findMany({
      where: {
        stato: 'COMPLETATA'
      },
      select: {
        id: true,
        servizioPrenotazione: {
          select: {
            servizio: {
              select: {
                prezzo: true
              }
            }
          }
        }
      }
    }).catch(error => {
      console.error('Errore nel recupero delle prenotazioni completate:', error);
      return [];
    });

    // Calcoliamo il revenue in modo sicuro
    const totalRevenue = completedBookings.reduce((acc, booking) => {
      const bookingTotal = booking.servizioPrenotazione?.reduce((sum, sp) => {
        return sum + (Number(sp.servizio?.prezzo) || 0);
      }, 0) || 0;
      return acc + bookingTotal;
    }, 0);

    // Prenotazioni di oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = await prisma.prenotazione.count({
      where: {
        dataOra: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    }).catch(error => {
      console.error('Errore nel recupero delle prenotazioni odierne:', error);
      return 0;
    });

    // Media prenotazioni per utente
    const averageBookingsPerUser = totalUsers > 0 
      ? Number((totalBookings / totalUsers).toFixed(2))
      : 0;

    return reply.send({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        completedBookings: completedBookings.length,
        totalRevenue,
        activeServices,
        todayBookings,
        averageBookingsPerUser
      }
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    return reply.status(500).send({
      success: false,
      error: 'Errore nel recupero delle statistiche. Per favore riprova più tardi.'
    });
  }
});

// Route per ottenere tutti i servizi
fastify.get('/api/services', async (request, reply) => {
  try {
    const services = await prisma.servizio.findMany({
      orderBy: { nome: 'asc' },
    });

    return reply.send({
      success: true,
      data: services,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Errore nel recupero dei servizi',
    });
  }
});

// Route per creare un nuovo servizio (solo admin)
fastify.post('/api/services', { preHandler: [adminMiddleware] }, async (request, reply) => {
  try {
    const data = serviceSchema.parse(request.body);

    const service = await prisma.servizio.create({
      data,
    });

    return reply.send({
      success: true,
      data: service,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: error.errors[0].message,
      });
    }

    return reply.status(500).send({
      success: false,
      error: 'Errore durante la creazione del servizio',
    });
  }
});

// Route per modificare un servizio (solo admin)
fastify.put('/api/services/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const data = serviceSchema.parse(request.body);

    const service = await prisma.servizio.update({
      where: { id },
      data,
    });

    return reply.send({
      success: true,
      data: service,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: error.errors[0].message,
      });
    }

    return reply.status(500).send({
      success: false,
      error: 'Errore durante la modifica del servizio',
    });
  }
});

// Route per eliminare un servizio (solo admin)
fastify.delete('/api/services/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    // Verifica se il servizio è utilizzato in prenotazioni
    const bookingsWithService = await prisma.prenotazioneServizio.findFirst({
      where: { servizioId: id },
    });

    if (bookingsWithService) {
      return reply.status(400).send({
        success: false,
        error: 'Non è possibile eliminare un servizio utilizzato in prenotazioni',
      });
    }

    await prisma.servizio.delete({
      where: { id },
    });

    return reply.send({
      success: true,
      data: null,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Errore durante l\'eliminazione del servizio',
    });
  }
});

// Route per il reset della password
fastify.post('/api/auth/reset-password', async (request, reply) => {
  try {
    const { email } = request.body as { email: string };

    // Verifica se l'utente esiste
    const user = await prisma.utente.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: 'Email non trovata',
      });
    }

    // Genera token di reset (valido per 1 ora)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Salva il token nel database
    await prisma.utente.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken },
    });

    // In un'applicazione reale, qui invieresti una vera email
    console.log(`Reset password token per ${email}: ${resetToken}`);

    return reply.send({
      success: true,
      message: 'Email di reset inviata con successo',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Errore durante il reset della password',
    });
  }
});

fastify.addHook('onRequest', (request, reply, done) => {
  console.log('Richiesta ricevuta:', {
    method: request.method,
    url: request.url,
    headers: request.headers
  });
  done();
});

// Aggiungi questa configurazione dopo la creazione dell'istanza fastify
fastify.register(async function (instance) {
  // Route di autenticazione
  instance.post('/login', async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);
      console.log('Dati ricevuti:', data);
      
      // Trova l'utente
      const user = await prisma.utente.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        return reply.status(400).send({
          success: false,
          error: 'Credenziali non valide',
        });
      }

      // Verifica la password
      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return reply.status(400).send({
          success: false,
          error: 'Credenziali non valide',
        });
      }

      // Genera token JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      // Rimuovi la password dalla risposta
      const { password, ...userWithoutPassword } = user;

      return reply.send({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('Errore login:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: error.errors[0].message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Errore durante il login',
      });
    }
  });

  instance.get('/me', { preHandler: [authMiddleware] }, async (request: any, reply) => {
    const { password, ...userWithoutPassword } = request.user;
    return reply.send({
      success: true,
      data: userWithoutPassword,
    });
  });

  instance.post('/register', async (request, reply) => {
    // ... codice per la registrazione
  });

  instance.post('/reset-password', async (request, reply) => {
    // ... codice per il reset password
  });
}, { prefix: '/api/auth' });

// Aggiungi questo middleware per il logging delle richieste
fastify.addHook('onRequest', (request, reply, done) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
  if (request.body) {
    console.log('Body:', request.body);
  }
  done();
});

// Route per eliminare un utente (solo admin)
fastify.delete('/api/admin/users/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
  console.log('=== INIZIO PROCESSO DI ELIMINAZIONE (Backend) ===');
  console.log('ID utente da eliminare:', request.params);
  
  try {
    const { id } = request.params as { id: string };

    // Query per ottenere tutte le possibili relazioni
    const user = await prisma.utente.findUnique({
      where: { id },
      include: {
        prenotazioni: {
          include: {
            servizi: true,
            recensione: true,
            barbiere: true
          }
        },
        barbiere: {
          include: {
            prenotazioni: {
              include: {
                servizi: true,
                recensione: true,
                utente: true
              }
            },
            disponibilita: true,
            utente: true
          }
        },
        recensioni: true,
        prenotazioniEffettuate: {
          include: {
            servizi: true,
            recensione: true,
            barbiere: true
          }
        },
        // Aggiungi altre possibili relazioni qui
        notifiche: true,
        messaggi: true
      }
    });

    if (!user) {
      console.log('Utente non trovato');
      return reply.status(404).send({
        success: false,
        error: 'Utente non trovato'
      });
    }

    console.log('=== DETTAGLI RELAZIONI TROVATE ===');
    console.log('Email utente:', user.email);
    console.log('Ruolo:', user.ruolo);
    console.log('Relazioni:', {
      prenotazioni: user.prenotazioni.length,
      recensioni: user.recensioni.length,
      barbiere: user.barbiere ? 'Sì' : 'No',
      prenotazioniEffettuate: user.prenotazioniEffettuate.length,
      notifiche: user.notifiche?.length || 0,
      messaggi: user.messaggi?.length || 0
    });

    await prisma.$transaction(async (tx) => {
      try {
        // 1. Elimina notifiche
        console.log('1. Eliminazione notifiche...');
        await tx.notifica.deleteMany({
          where: { utenteId: id }
        });

        // 2. Elimina messaggi
        console.log('2. Eliminazione messaggi...');
        await tx.messaggio.deleteMany({
          where: { OR: [{ mittente: id }, { destinatario: id }] }
        });

        // 3. Elimina recensioni associate alle prenotazioni
        console.log('3. Eliminazione recensioni...');
        await tx.recensione.deleteMany({
          where: {
            OR: [
              { utenteId: id },
              { prenotazione: { utenteId: id } },
              { prenotazione: { barbiereId: user.barbiere?.id } }
            ]
          }
        });

        // 4. Elimina servizi delle prenotazioni
        console.log('4. Eliminazione servizi prenotazioni...');
        await tx.prenotazioneServizio.deleteMany({
          where: {
            OR: [
              { prenotazione: { utenteId: id } },
              { prenotazione: { barbiereId: user.barbiere?.id } }
            ]
          }
        });

        // 5. Elimina prenotazioni
        console.log('5. Eliminazione prenotazioni...');
        await tx.prenotazione.deleteMany({
          where: {
            OR: [
              { utenteId: id },
              { barbiereId: user.barbiere?.id }
            ]
          }
        });

        // 6. Se è un barbiere, elimina disponibilità e record barbiere
        if (user.barbiere) {
          console.log('6a. Eliminazione disponibilità barbiere...');
          await tx.disponibilita.deleteMany({
            where: { barbiereId: user.barbiere.id }
          });

          console.log('6b. Eliminazione record barbiere...');
          await tx.barbiere.delete({
            where: { id: user.barbiere.id }
          });
        }

        // 7. Pulizia dati utente
        console.log('7. Pulizia dati utente...');
        await tx.utente.update({
          where: { id },
          data: {
            resetPasswordToken: null,
            fotoProfilo: null,
            email: `deleted_${id}@deleted.com`, // Per evitare conflitti futuri
            password: 'DELETED',
            telefono: 'DELETED'
          }
        });

        // 8. Finalmente elimina l'utente
        console.log('8. Eliminazione utente...');
        await tx.utente.delete({
          where: { id }
        });

        console.log('Transazione completata con successo');
      } catch (txError) {
        console.error('Errore durante la transazione:', txError);
        console.error('Stack trace:', txError.stack);
        throw txError;
      }
    });

    console.log('=== FINE PROCESSO DI ELIMINAZIONE (Successo) ===');
    return reply.send({
      success: true,
      message: 'Utente eliminato con successo'
    });
  } catch (error: any) {
    console.error('=== ERRORE DURANTE L\'ELIMINAZIONE ===');
    console.error('Errore completo:', error);
    console.error('Stack trace:', error.stack);
    console.error('Query error:', error.meta);
    
    return reply.status(500).send({
      success: false,
      error: 'Errore durante l\'eliminazione dell\'utente',
      details: error.message,
      meta: error.meta
    });
  }
});

// Avvio server
const start = async () => {
  try {
    await fastify.listen({ 
      port: 5000,
      host: '0.0.0.0' 
    });
    console.log('Server in ascolto su http://localhost:5000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
