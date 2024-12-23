import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Importa i router
import notificationsRouter from './routes/notifications';
import bookingsRouter from './routes/bookings';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Inizializzazione server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

// Test della connessione al database
async function testDatabaseConnection() {
  try {
    console.log('Tentativo di connessione al database...');
    await prisma.$connect();
    console.log('✅ Connessione al database riuscita!');
    return true;
  } catch (error) {
    console.error('❌ Errore di connessione al database:', error);
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura multer per il caricamento dei file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(process.cwd(), 'public/uploads/profile-images');
    console.log('Upload path:', uploadPath);
    
    // Assicurati che la directory esista
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Genera un nome file unico
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Usa JPEG, PNG o GIF.'));
    }
  }
});

// Configura il percorso degli uploads e serve i file statici
const uploadsPath = path.resolve(process.cwd(), 'public/uploads');
const profileImagesPath = path.join(uploadsPath, 'profile-images');

// Assicurati che le cartelle esistano
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
if (!fs.existsSync(profileImagesPath)) {
  fs.mkdirSync(profileImagesPath, { recursive: true });
}

// Servi i file statici
app.use('/uploads', express.static(uploadsPath));
console.log('Serving static files from:', uploadsPath);

// Middleware per il logging delle richieste
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Middleware per verificare il JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Token non fornito');
    return res.status(401).json({ 
      success: false, 
      error: 'Token non fornito' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      console.error('Errore verifica token:', err);
      return res.status(403).json({ 
        success: false, 
        error: 'Token non valido',
        details: err.message
      });
    }
    console.log('User dal token:', user);
    req.user = user;
    next();
  });
};

// Middleware per verificare se l'utente è admin
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.utente.findUnique({
      where: { id: req.user.id }
    });

    if (user?.ruolo !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Accesso non autorizzato'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante la verifica dei permessi'
    });
  }
};

// Schema di validazione per la registrazione
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
  nome: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve essere di almeno 2 caratteri'),
  telefono: z.string().optional(),
});

// Schema di validazione per il login
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password non valida'),
});

// Schema di validazione per l'aggiornamento utente
const updateUserSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  cognome: z.string().min(1, 'Il cognome è obbligatorio'),
  email: z.string().email('Email non valida'),
  telefono: z.string().optional(),
  ruolo: z.enum(['ADMIN', 'BARBIERE', 'CLIENTE']),
  genere: z.enum(['M', 'F']).optional()
});

// Schema di validazione per l'orario di lavoro
const orarioLavoroSchema = z.object({
  giorno: z.number().min(1).max(7),
  oraInizio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  oraFine: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

// Schema di validazione per il barbiere
const barberSchema = z.object({
  utenteId: z.string(),
  specialita: z.array(z.string()),  // Array di stringhe
  descrizione: z.string().min(1, 'La descrizione è obbligatoria'),
  orariLavoro: z.array(orarioLavoroSchema)
});

// Route per la registrazione
app.post('/api/auth/register', upload.single('fotoProfilo'), async (req, res) => {
  try {
    console.log('=== INIZIO REGISTRAZIONE ===');
    console.log('Body della richiesta:', req.body);
    console.log('File caricato:', req.file);

    // Validazione dei dati
    console.log('Validazione dati...');
    const validatedData = registerSchema.parse({
      email: req.body.email,
      password: req.body.password,
      nome: req.body.nome,
      cognome: req.body.cognome,
      telefono: req.body.telefono || null,
    });
    console.log('Dati validati:', { ...validatedData, password: '[NASCOSTA]' });

    // Verifica se l'utente esiste già
    console.log('Verifica utente esistente...');
    const existingUser = await prisma.utente.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      console.log('Utente già esistente:', validatedData.email);
      return res.status(400).json({
        success: false,
        error: 'Un utente con questa email è già registrato'
      });
    }

    // Hash della password
    console.log('Generazione hash password...');
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Gestisci il file della foto profilo
    let fotoProfiloUrl = null;
    if (req.file) {
      // Salva il percorso relativo dell'immagine
      fotoProfiloUrl = path.join('profile-images', req.file.filename);
      console.log('Percorso relativo foto profilo:', fotoProfiloUrl);
    }

    // Creazione nuovo utente
    console.log('Creazione nuovo utente...');
    const newUser = await prisma.utente.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        nome: validatedData.nome,
        cognome: validatedData.cognome,
        telefono: validatedData.telefono || null,
        fotoProfilo: fotoProfiloUrl,
        ruolo: 'CLIENTE'
      }
    });

    console.log('Utente creato con successo:', newUser.id);

    // Genera JWT
    console.log('Generazione token JWT...');
    const token = jwt.sign(
      { 
        id: newUser.id,
        email: newUser.email,
        ruolo: newUser.ruolo
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = newUser;

    console.log('=== REGISTRAZIONE COMPLETATA ===');
    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('=== ERRORE REGISTRAZIONE ===');
    console.error('Tipo di errore:', error.constructor.name);
    console.error('Messaggio errore:', error.message);
    
    if (error instanceof z.ZodError) {
      console.error('Errori di validazione:', error.errors);
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }

    // Log dettagliato dell'errore
    if (error instanceof Error) {
      console.error('Dettagli errore:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Se è un errore di Prisma, log specifico
      if (error.name === 'PrismaClientKnownRequestError') {
        console.error('Errore Prisma:', {
          code: (error as any).code,
          meta: (error as any).meta,
          clientVersion: (error as any).clientVersion
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Si è verificato un errore durante la registrazione'
    });
  }
});

// Route per il login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.utente.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        ruolo: user.ruolo
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Errore durante il login:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors.map(err => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Errore durante il login'
    });
  }
});

// Route per ottenere i dati dell'utente corrente
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.utente.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
        fotoProfilo: true,
        telefono: true,
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei dati utente'
    });
  }
});

// Route per ottenere tutti gli utenti (solo admin)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.utente.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        ruolo: true,
        createdAt: true,
        fotoProfilo: true
      }
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli utenti'
    });
  }
});

// Route per eliminare un utente (solo admin)
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se l'utente esiste
    const user = await prisma.utente.findUnique({
      where: { id },
      include: {
        barbiere: {
          include: {
            prenotazioni: {
              include: {
                servizi: true
              }
            },
            orariLavoro: true,
            servizi: true,
            recensioni: true
          }
        },
        prenotazioni: {
          include: {
            servizi: true
          }
        },
        recensioni: true,
        notifiche: true,
        tokenReset: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Se l'utente ha una foto profilo, eliminala
    if (user.fotoProfilo) {
      const filePath = path.join(process.cwd(), 'public/uploads', user.fotoProfilo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Elimina tutti i record correlati in ordine
    await prisma.$transaction(async (tx) => {
      // Se l'utente è un barbiere
      if (user.barbiere) {
        // Prima elimina le relazioni PrenotazioneServizio per le prenotazioni del barbiere
        for (const prenotazione of user.barbiere.prenotazioni) {
          await tx.prenotazioneServizio.deleteMany({
            where: { prenotazioneId: prenotazione.id }
          });
        }

        // Poi elimina le prenotazioni associate al barbiere
        await tx.prenotazione.deleteMany({
          where: { barbiereId: user.barbiere.id }
        });

        // Elimina le recensioni associate al barbiere
        await tx.recensione.deleteMany({
          where: { barbiereId: user.barbiere.id }
        });

        // Elimina gli orari di lavoro
        await tx.orarioLavoro.deleteMany({
          where: { barbiereId: user.barbiere.id }
        });

        // Elimina le relazioni ServiziBarbiere
        await tx.serviziBarbiere.deleteMany({
          where: { barbiereId: user.barbiere.id }
        });

        // Elimina il record barbiere
        await tx.barbiere.delete({
          where: { id: user.barbiere.id }
        });
      }

      // Per le prenotazioni fatte dall'utente come cliente
      for (const prenotazione of user.prenotazioni) {
        await tx.prenotazioneServizio.deleteMany({
          where: { prenotazioneId: prenotazione.id }
        });
      }

      // Elimina le prenotazioni dell'utente
      await tx.prenotazione.deleteMany({
        where: { utenteId: id }
      });

      // Elimina le recensioni dell'utente
      await tx.recensione.deleteMany({
        where: { utenteId: id }
      });

      // Elimina le notifiche
      await tx.notifica.deleteMany({
        where: { utenteId: id }
      });

      // Il tokenReset verrà eliminato automaticamente grazie a onDelete: Cascade

      // Infine elimina l'utente
      await tx.utente.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Utente eliminato con successo'
    });

  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione dell\'utente',
      details: error.message
    });
  }
});

// Route per aggiornare un utente (solo admin)
app.put('/api/users/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    console.log('Richiesta di aggiornamento utente:', { id, body: req.body });

    // Valida i dati in ingresso
    const updateData = updateUserSchema.parse(req.body);
    console.log('Dati validati:', updateData);

    // Verifica se l'utente esiste
    const existingUser = await prisma.utente.findUnique({
      where: { id },
      include: {
        barbiere: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    console.log('Utente esistente:', existingUser);
    
    // Prepara i dati da aggiornare
    const dataToUpdate = {
      nome: updateData.nome,
      cognome: updateData.cognome,
      email: updateData.email,
      telefono: updateData.telefono || '',
      ruolo: updateData.ruolo,
      genere: updateData.genere || existingUser.genere || 'M'
    };

    console.log('Dati da aggiornare:', dataToUpdate);

    // Aggiorna l'utente
    const updatedUser = await prisma.utente.update({
      where: { id },
      data: dataToUpdate,
      include: {
        barbiere: true
      }
    });

    console.log('Utente aggiornato:', updatedUser);

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Errore durante l\'aggiornamento dell\'utente:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante l\'aggiornamento dell\'utente'
    });
  }
});

// Route per ottenere tutte le prenotazioni (solo admin)
app.get('/api/admin/bookings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = await prisma.prenotazione.findMany({
      include: {
        utente: {
          select: {
            nome: true,
            cognome: true
          }
        },
        servizi: {
          include: {
            servizio: {
              select: {
                nome: true,
                prezzo: true
              }
            }
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Errore nel recupero delle prenotazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle prenotazioni'
    });
  }
});

// Route per ottenere le statistiche (solo admin)
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    console.log('Inizio recupero statistiche...');
    
    // Recupera i dati necessari dal database
    const [totalUsers, totalBookings, bookingsWithServices] = await Promise.all([
      prisma.utente.count(),
      prisma.prenotazione.count(),
      prisma.prenotazione.findMany({
        include: {
          servizi: {
            include: {
              servizio: {
                select: {
                  prezzo: true
                }
              }
            }
          }
        }
      })
    ]);

    console.log('Dati recuperati:', {
      totalUsers,
      totalBookings,
      bookingsCount: bookingsWithServices.length
    });

    // Calcola il fatturato totale in modo sicuro
    let totalRevenue = 0;
    try {
      totalRevenue = bookingsWithServices.reduce((acc, booking) => {
        const bookingRevenue = booking.servizi.reduce((total, s) => {
          // Assicurati che il prezzo sia un numero
          const price = typeof s.servizio.prezzo === 'string' 
            ? parseFloat(s.servizio.prezzo) 
            : Number(s.servizio.prezzo);
          return total + (isNaN(price) ? 0 : price);
        }, 0);
        return acc + bookingRevenue;
      }, 0);
    } catch (error) {
      console.error('Errore nel calcolo del fatturato:', error);
      totalRevenue = 0;
    }

    console.log('Fatturato calcolato:', totalRevenue);

    // Calcola la media delle prenotazioni per utente
    const averageBookingsPerUser = totalUsers > 0 ? totalBookings / totalUsers : 0;

    // Conta i servizi attivi
    const activeServices = await prisma.servizio.count();

    // Conta le prenotazioni di oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await prisma.prenotazione.count({
      where: {
        dataOra: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const stats = {
      totalUsers: Number(totalUsers),
      totalBookings: Number(totalBookings),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageBookingsPerUser: Number(averageBookingsPerUser.toFixed(2)),
      todayBookings: Number(todayBookings),
      activeServices: Number(activeServices)
    };

    console.log('Statistiche calcolate:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche'
    });
  }
});

// Endpoint per ottenere i trend delle prenotazioni
app.get('/api/admin/booking-trends', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30); // Ultimi 30 giorni

    const bookings = await prisma.prenotazione.findMany({
      where: {
        dataOra: {
          gte: startDate,
          lte: today,
        },
      },
      select: {
        dataOra: true,
      },
      orderBy: {
        dataOra: 'asc',
      },
    });

    // Raggruppa le prenotazioni per data
    const trendsMap = bookings.reduce((acc: { [key: string]: number }, booking) => {
      const date = booking.dataOra.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Crea un array di tutti i giorni nel periodo
    const trends = [];
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      trends.push({
        date,
        count: trendsMap[date] || 0,
      });
    }

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Errore nel recupero dei trend delle prenotazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei trend delle prenotazioni',
    });
  }
});

// Endpoint per ottenere le statistiche dei servizi
app.get('/api/admin/service-stats', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    // Recupera i servizi più popolari
    const bookingsWithServices = await prisma.prenotazione.findMany({
      include: {
        servizi: {
          include: {
            servizio: true,
          },
        },
      },
    });

    // Calcola la popolarità dei servizi
    const servicePopularity: { [key: string]: number } = {};
    bookingsWithServices.forEach(booking => {
      booking.servizi.forEach(service => {
        const serviceName = service.servizio.nome;
        servicePopularity[serviceName] = (servicePopularity[serviceName] || 0) + 1;
      });
    });

    const popularServices = Object.entries(servicePopularity)
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 servizi

    // Calcola la distribuzione delle fasce orarie
    const timeSlotDistribution: { [key: string]: number } = {};
    bookingsWithServices.forEach(booking => {
      const hour = booking.dataOra.getHours();
      const timeSlot = `${hour}:00`;
      timeSlotDistribution[timeSlot] = (timeSlotDistribution[timeSlot] || 0) + 1;
    });

    const timeSlots = Object.entries(timeSlotDistribution)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    res.json({
      success: true,
      data: {
        popularServices,
        timeSlotDistribution: timeSlots,
      },
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche dei servizi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche dei servizi',
    });
  }
});

// Route per ottenere tutti i servizi
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.servizio.findMany();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei servizi'
    });
  }
});

// Route per ottenere i punti fedeltà dell'utente
app.get('/api/points/my', authenticateToken, async (req: any, res) => {
  try {
    console.log('Recupero punti per utente:', req.user.id);
    
    // Prima verifichiamo se l'utente esiste
    const user = await prisma.utente.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, punti: true }
    });

    if (!user) {
      console.error('Utente non trovato:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    console.log('Utente trovato:', user);
    
    res.json({
      success: true,
      data: user.punti || 0
    });
  } catch (error) {
    console.error('Errore dettagliato nel recupero dei punti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei punti',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Route per ottenere i barbieri
app.get('/api/barbers', async (req, res) => {
  try {
    const barbers = await prisma.barbiere.findMany({
      include: {
        utente: {
          select: {
            nome: true,
            cognome: true,
            fotoProfilo: true
          }
        }
      }
    });

    const formattedBarbers = barbers.map(barber => ({
      id: barber.id,
      nome: barber.utente.nome,
      cognome: barber.utente.cognome,
      fotoProfilo: barber.utente.fotoProfilo
    }));

    res.json({
      success: true,
      data: formattedBarbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei barbieri'
    });
  }
});

// Route per ottenere gli orari disponibili
app.get('/api/bookings/available-times', async (req, res) => {
  try {
    const { barbiereId, data, durata } = req.query;
    console.log('Richiesta orari disponibili:', { barbiereId, data, durata });
    
    if (!barbiereId || !data || !durata) {
      return res.status(400).json({
        success: false,
        error: 'Parametri mancanti. Richiesti: barbiereId, data, durata'
      });
    }

    // Trova gli orari di lavoro del barbiere per il giorno della settimana specificato
    const dataObj = new Date(data as string);
    const giorno = dataObj.getDay(); // 0 = domenica, 1 = lunedì, ecc.
    console.log('Cercando orari di lavoro per giorno:', giorno);

    const orariLavoro = await prisma.orarioLavoro.findFirst({
      where: {
        barbiereId: barbiereId as string,
        giorno: giorno
      }
    });
    console.log('Orari di lavoro trovati:', orariLavoro);

    if (!orariLavoro) {
      console.log('Nessun orario di lavoro trovato per questo giorno');
      return res.json({
        success: true,
        times: []  // Il barbiere non lavora in questo giorno
      });
    }

    // Trova tutte le prenotazioni del barbiere per la data specificata
    const prenotazioni = await prisma.prenotazione.findMany({
      where: {
        barbiereId: barbiereId as string,
        dataOra: {
          gte: new Date(`${data}T00:00:00.000Z`),
          lt: new Date(`${data}T23:59:59.999Z`)
        }
      },
      include: {
        servizi: {
          include: {
            servizio: {
              select: {
                prezzo: true
              }
            }
          }
        }
      }
    });
    console.log('Prenotazioni trovate:', prenotazioni);

    // Genera gli slot disponibili considerando la durata richiesta
    const orarioInizio = new Date(`${data}T${orariLavoro.oraInizio}`);
    const orarioFine = new Date(`${data}T${orariLavoro.oraFine}`);
    const durataMins = parseInt(durata as string);
    const slots: string[] = [];
    console.log('Calcolo slots tra:', { 
      orarioInizio: orarioInizio.toISOString(), 
      orarioFine: orarioFine.toISOString(), 
      durataMins 
    });

    for (let time = new Date(orarioInizio); time < orarioFine; time.setMinutes(time.getMinutes() + 30)) {
      const timeString = time.toISOString().slice(11, 16);
      const endTime = new Date(time.getTime() + durataMins * 60000);
      
      // Verifica se lo slot è disponibile per l'intera durata del servizio
      const isDisponibile = !prenotazioni.some(prenotazione => {
        const prenotazioneInizio = new Date(prenotazione.dataOra);
        const durataTotale = prenotazione.servizi.reduce((total, s) => total + s.servizio.durata, 0);
        const prenotazioneFine = new Date(prenotazioneInizio.getTime() + durataTotale * 60000);
        
        return (time < prenotazioneFine && endTime > prenotazioneInizio);
      });

      if (isDisponibile && endTime <= orarioFine) {
        slots.push(timeString);
      }
    }
    console.log('Slots disponibili trovati:', slots);

    res.json({
      success: true,
      times: slots
    });
  } catch (error) {
    console.error('Errore durante il recupero degli orari disponibili:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero degli orari disponibili'
    });
  }
});

// Route per ottenere le disponibilità di un barbiere (deprecato)
app.get('/api/disponibilita', async (req, res) => {
  try {
    const { barbiere_id, data } = req.query;
    
    if (!barbiere_id || !data) {
      return res.status(400).json({
        success: false,
        error: 'Parametri mancanti'
      });
    }

    // Trova gli orari di lavoro del barbiere per il giorno della settimana specificato
    const dataObj = new Date(data as string);
    const giorno = dataObj.getDay(); // 0 = domenica, 1 = lunedì, ecc.

    const orariLavoro = await prisma.orarioLavoro.findFirst({
      where: {
        barbiereId: barbiere_id as string,
        giorno: giorno
      }
    });

    if (!orariLavoro) {
      return res.json([]);  // Il barbiere non lavora in questo giorno
    }

    // Trova tutte le prenotazioni del barbiere per la data specificata
    const prenotazioni = await prisma.prenotazione.findMany({
      where: {
        barbiereId: barbiere_id as string,
        dataOra: {
          gte: new Date(`${data}T00:00:00.000Z`),
          lt: new Date(`${data}T23:59:59.999Z`)
        }
      },
      include: {
        servizi: {
          include: {
            servizio: {
              select: {
                nome: true,
                prezzo: true,
              }
            }
          }
        }
      },
      orderBy: {
        dataOra: 'asc'
      }
    });

    // Genera gli slot disponibili
    const orarioInizio = new Date(`${data}T${orariLavoro.oraInizio}.000Z`);
    const orarioFine = new Date(`${data}T${orariLavoro.oraFine}.000Z`);
    const slotDuration = 30; // durata slot in minuti
    const slots: string[] = [];

    for (let time = orarioInizio; time < orarioFine; time.setMinutes(time.getMinutes() + slotDuration)) {
      const timeString = time.toISOString().slice(11, 16);
      
      // Verifica se lo slot è già occupato
      const isOccupato = prenotazioni.some(prenotazione => {
        const prenotazioneOra = new Date(prenotazione.dataOra).toISOString().slice(11, 16);
        return prenotazioneOra === timeString;
      });

      if (!isOccupato) {
        slots.push(timeString);
      }
    }

    res.json(slots);
  } catch (error) {
    console.error('Errore durante il recupero delle disponibilità:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle disponibilità'
    });
  }
});

// Endpoint per ottenere le prenotazioni dell'utente corrente
app.get('/api/bookings/my', authenticateToken, async (req: any, res) => {
  try {
    const bookings = await prisma.prenotazione.findMany({
      where: {
        utenteId: req.user.id
      },
      include: {
        servizi: {
          include: {
            servizio: {
              select: {
                nome: true,
                durata: true,
                prezzo: true
              }
            }
          }
        },
        barbiere: {
          include: {
            utente: {
              select: {
                nome: true,
                cognome: true,
                fotoProfilo: true
              }
            }
          }
        }
      },
      orderBy: {
        dataOra: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle prenotazioni'
    });
  }
});

// Endpoint per cancellare una prenotazione
app.delete('/api/bookings/:id', authenticateToken, async (req: any, res) => {
  try {
    // Verifica che l'ID sia nel formato corretto
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID prenotazione non valido'
      });
    }

    const booking = await prisma.prenotazione.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Prenotazione non trovata'
      });
    }

    if (booking.utenteId !== req.user.id && req.user.ruolo !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Non hai i permessi per cancellare questa prenotazione'
      });
    }

    // Prima elimina i servizi associati alla prenotazione
    await prisma.prenotazioneServizio.deleteMany({
      where: {
        prenotazioneId: req.params.id
      }
    });

    // Poi elimina la prenotazione
    await prisma.prenotazione.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({
      success: true,
      message: 'Prenotazione cancellata con successo'
    });
  } catch (error) {
    console.error('Errore durante la cancellazione della prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la cancellazione della prenotazione',
      details: error.message
    });
  }
});

// Endpoint per creare un nuovo barbiere
app.post('/api/admin/barbers', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Creazione barbiere - dati ricevuti:', req.body);
    const data = barberSchema.parse(req.body);

    // Verifica che l'utente esista
    const user = await prisma.utente.findUnique({
      where: { id: data.utenteId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Verifica che non esista già un barbiere per questo utente
    const existingBarber = await prisma.barbiere.findUnique({
      where: { utenteId: data.utenteId }
    });

    if (existingBarber) {
      return res.status(400).json({
        success: false,
        error: 'Esiste già un barbiere per questo utente'
      });
    }

    // Crea il barbiere e i suoi orari di lavoro in una transazione
    const result = await prisma.$transaction(async (prisma) => {
      // Crea il barbiere
      const barber = await prisma.barbiere.create({
        data: {
          utente: {
            connect: { id: data.utenteId }
          },
          specialita: data.specialita,
          descrizione: data.descrizione
        }
      });

      // Crea gli orari di lavoro
      const orariPromises = data.orariLavoro.map(orario => 
        prisma.orarioLavoro.create({
          data: {
            barbiere: {
              connect: { id: barber.id }
            },
            giorno: orario.giorno,
            oraInizio: orario.oraInizio,
            oraFine: orario.oraFine
          }
        })
      );

      const orari = await Promise.all(orariPromises);

      return { barber, orari };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Errore nella creazione del barbiere:', error);
    res.status(500).json({
      success: false,
      error: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Errore nella creazione del barbiere'
    });
  }
});

// Endpoint per eliminare un barbiere
app.delete('/api/admin/barbers/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verifica che il barbiere esista
    const barber = await prisma.barbiere.findUnique({
      where: { utenteId: userId }
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: 'Barbiere non trovato'
      });
    }

    // Elimina il barbiere e tutti i dati correlati in una transazione
    await prisma.$transaction(async (prisma) => {
      // Elimina gli orari di lavoro
      await prisma.orarioLavoro.deleteMany({
        where: { barbiereId: barber.id }
      });

      // Elimina il barbiere
      await prisma.barbiere.delete({
        where: { utenteId: userId }
      });
    });

    res.json({
      success: true,
      message: 'Barbiere eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nella eliminazione del barbiere:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella eliminazione del barbiere'
    });
  }
});

// API Routes
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.servizio.findMany();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Errore nel recupero dei servizi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei servizi'
    });
  }
});

app.get('/api/points/my', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const points = await prisma.utente.findUnique({
      where: { id: userId },
      select: { punti: true }
    });
    
    res.json({
      success: true,
      data: points?.punti || 0
    });
  } catch (error) {
    console.error('Errore nel recupero dei punti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei punti'
    });
  }
});

app.get('/api/barbieri', async (req, res) => {
  try {
    const barbers = await prisma.barbiere.findMany({
      include: {
        utente: {
          select: {
            nome: true,
            cognome: true,
            fotoProfilo: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    console.error('Errore nel recupero dei barbieri:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei barbieri'
    });
  }
});

app.get('/api/servizi', async (req, res) => {
  try {
    const services = await prisma.servizio.findMany();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Errore nel recupero dei servizi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei servizi'
    });
  }
});

// Route delle notifiche
app.use('/api/notifications', authenticateToken, notificationsRouter);
app.use('/api/bookings', bookingsRouter);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server Express funzionante!' });
});

// Test route per creare una notifica
app.post('/api/test/notification', authenticateToken, async (req: any, res) => {
  try {
    const notification = await prisma.notifica.create({
      data: {
        utenteId: req.user.id,
        tipo: 'SISTEMA',
        messaggio: 'Questa è una notifica di test'
      }
    });

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Errore nella creazione della notifica di test:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione della notifica di test'
    });
  }
});

// Endpoint per l'upload della foto profilo
app.post('/api/users/photo', authenticateToken, upload.single('photo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nessun file caricato' 
      });
    }

    console.log('File caricato:', req.file);
    console.log('Nome file:', req.file.filename);

    // Salva il percorso relativo nel database
    const relativePath = path.join('profile-images', req.file.filename);
    console.log('Percorso relativo:', relativePath);

    const utente = await prisma.utente.update({
      where: { id: req.user.id },
      data: { fotoProfilo: relativePath },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        fotoProfilo: true,
        ruolo: true
      }
    });

    console.log('Utente aggiornato:', utente);

    res.json({ 
      success: true, 
      data: utente
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore durante il caricamento della foto' 
    });
  }
});

// Endpoint per ottenere le recensioni dell'utente
app.get('/api/reviews/my', authenticateToken, async (req: any, res) => {
  try {
    const reviews = await prisma.recensione.findMany({
      where: {
        utenteId: req.user.id
      },
      include: {
        servizio: true,
        barbiere: {
          include: {
            utente: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Errore nel recupero delle recensioni' });
  }
});

// Endpoint per ottenere le promozioni attive
app.get('/api/promotions', authenticateToken, async (req, res) => {
  try {
    const currentDate = new Date();
    const promotions = await prisma.promozione.findMany({
      where: {
        validoDal: {
          lte: currentDate
        },
        validoAl: {
          gte: currentDate
        }
      },
      orderBy: {
        validoAl: 'asc'
      }
    });

    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ error: 'Errore nel recupero delle promozioni' });
  }
});

// Endpoint per ottenere i servizi preferiti dell'utente
app.get('/api/services/favorites', authenticateToken, async (req: any, res) => {
  try {
    // Ottieni tutte le prenotazioni dell'utente con i servizi
    const bookings = await prisma.prenotazione.findMany({
      where: {
        utenteId: req.user.id,
        stato: 'COMPLETATA'
      },
      include: {
        servizi: {
          include: {
            servizio: true
          }
        }
      }
    });

    // Calcola i servizi più utilizzati
    const serviceCount = new Map<string, { count: number; lastBooked: Date; service: any }>();
    
    bookings.forEach(booking => {
      booking.servizi.forEach(({ servizio }) => {
        const current = serviceCount.get(servizio.id) || { 
          count: 0, 
          lastBooked: booking.dataOra,
          service: servizio 
        };
        
        serviceCount.set(servizio.id, {
          count: current.count + 1,
          lastBooked: booking.dataOra > current.lastBooked ? booking.dataOra : current.lastBooked,
          service: servizio
        });
      });
    });

    // Converti la Map in array e ordina per conteggio
    const favoriteServices = Array.from(serviceCount.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        count: data.count,
        lastBooked: data.lastBooked,
        service: data.service
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Prendi solo i primi 5

    res.json(favoriteServices);
  } catch (error) {
    console.error('Error fetching favorite services:', error);
    res.status(500).json({ error: 'Errore nel recupero dei servizi preferiti' });
  }
});

// Endpoint per rimuovere un servizio dai preferiti
app.delete('/api/services/favorites/:serviceId', authenticateToken, async (req: any, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user.id;

    // Verifica se il servizio è tra i preferiti dell'utente
    const favorite = await prisma.servizioPreferito.findFirst({
      where: {
        utenteId: userId,
        servizioId: serviceId
      }
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato tra i preferiti'
      });
    }

    // Rimuovi il servizio dai preferiti
    await prisma.servizioPreferito.delete({
      where: {
        id: favorite.id
      }
    });

    res.json({
      success: true,
      message: 'Servizio rimosso dai preferiti'
    });
  } catch (error) {
    console.error('Errore durante la rimozione del servizio dai preferiti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la rimozione del servizio dai preferiti'
    });
  }
});

// Endpoint per aggiungere un servizio ai preferiti
app.post('/api/services/favorites/:serviceId', authenticateToken, async (req: any, res) => {
  try {
    const { serviceId } = req.params;
    const userId = req.user.id;

    // Verifica se il servizio esiste
    const service = await prisma.servizio.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Verifica se il servizio è già tra i preferiti
    const existingFavorite = await prisma.servizioPreferito.findFirst({
      where: {
        utenteId: userId,
        servizioId: serviceId
      }
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Servizio già presente nei preferiti'
      });
    }

    // Aggiungi il servizio ai preferiti
    const favorite = await prisma.servizioPreferito.create({
      data: {
        utente: {
          connect: { id: userId }
        },
        servizio: {
          connect: { id: serviceId }
        }
      },
      include: {
        servizio: true
      }
    });

    res.json({
      success: true,
      message: 'Servizio aggiunto ai preferiti',
      data: favorite
    });
  } catch (error) {
    console.error('Errore durante l\'aggiunta del servizio ai preferiti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiunta del servizio ai preferiti'
    });
  }
});

// Endpoint per creare un nuovo barbiere
app.post('/api/admin/barbers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const data = barberSchema.parse(req.body);

    // Verifica che l'utente esista
    const user = await prisma.utente.findUnique({
      where: { id: data.utenteId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Verifica che non esista già un barbiere per questo utente
    const existingBarber = await prisma.barbiere.findUnique({
      where: { utenteId: data.utenteId }
    });

    if (existingBarber) {
      return res.status(400).json({
        success: false,
        error: 'Esiste già un barbiere per questo utente'
      });
    }

    // Crea il barbiere e i suoi orari di lavoro in una transazione
    const result = await prisma.$transaction(async (prisma) => {
      // Crea il barbiere
      const barber = await prisma.barbiere.create({
        data: {
          utente: {
            connect: { id: data.utenteId }
          },
          specialita: data.specialita,
          descrizione: data.descrizione
        }
      });

      // Crea gli orari di lavoro
      const orariPromises = data.orariLavoro.map(orario => 
        prisma.orarioLavoro.create({
          data: {
            barbiere: {
              connect: { id: barber.id }
            },
            giorno: orario.giorno,
            oraInizio: orario.oraInizio,
            oraFine: orario.oraFine
          }
        })
      );

      const orari = await Promise.all(orariPromises);

      return { barber, orari };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Errore nella creazione del barbiere:', error);
    res.status(500).json({
      success: false,
      error: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Errore nella creazione del barbiere'
    });
  }
});

// Endpoint per eliminare un barbiere
app.delete('/api/admin/barbers/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verifica che il barbiere esista
    const barber = await prisma.barbiere.findUnique({
      where: { utenteId: userId }
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        error: 'Barbiere non trovato'
      });
    }

    // Elimina il barbiere e tutti i dati correlati in una transazione
    await prisma.$transaction(async (prisma) => {
      // Elimina gli orari di lavoro
      await prisma.orarioLavoro.deleteMany({
        where: { barbiereId: barber.id }
      });

      // Elimina il barbiere
      await prisma.barbiere.delete({
        where: { utenteId: userId }
      });
    });

    res.json({
      success: true,
      message: 'Barbiere eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nella eliminazione del barbiere:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella eliminazione del barbiere'
    });
  }
});

// API Routes
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.servizio.findMany();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Errore nel recupero dei servizi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei servizi'
    });
  }
});

app.get('/api/points/my', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const points = await prisma.utente.findUnique({
      where: { id: userId },
      select: { punti: true }
    });
    
    res.json({
      success: true,
      data: points?.punti || 0
    });
  } catch (error) {
    console.error('Errore nel recupero dei punti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei punti'
    });
  }
});

app.get('/api/barbieri', async (req, res) => {
  try {
    const barbers = await prisma.barbiere.findMany({
      include: {
        utente: {
          select: {
            nome: true,
            cognome: true,
            fotoProfilo: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    console.error('Errore nel recupero dei barbieri:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei barbieri'
    });
  }
});

app.get('/api/servizi', async (req, res) => {
  try {
    const services = await prisma.servizio.findMany();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Errore nel recupero dei servizi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei servizi'
    });
  }
});

// Route per caricare la foto di un barbiere
app.post('/api/admin/barbers/upload-photo', authenticateToken, isAdmin, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nessuna foto caricata'
      });
    }

    // Salva il percorso relativo dell'immagine
    const fotoProfiloUrl = path.join('profile-images', req.file.filename);

    // Aggiorna il barbiere con il nuovo percorso della foto
    await prisma.barbiere.update({
      where: { id: req.body.barbiereId },
      data: {
        utente: {
          update: {
            fotoProfilo: fotoProfiloUrl
          }
        }
      }
    });

    res.json({
      success: true,
      data: { fotoProfiloUrl }
    });
  } catch (error) {
    console.error('Errore nel caricamento della foto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel caricamento della foto'
    });
  }
});

// Avvio del server con Socket.IO
async function startServer() {
  try {
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('❌ Impossibile avviare il server senza una connessione al database');
      process.exit(1);
    }

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true
      }
    });

    // Socket.IO connection handler
    io.on('connection', (socket) => {
      console.log('Client connesso:', socket.id);

      // Autenticazione del socket
      const userId = socket.handshake.auth.userId;
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Utente ${userId} connesso al proprio canale`);
      }

      socket.on('disconnect', () => {
        console.log('Client disconnesso:', socket.id);
      });
    });

    // Aggiungi io all'app per usarlo nelle route
    app.set('io', io);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server in esecuzione su http://localhost:${PORT}`);
      console.log('📱 Socket.IO attivo e in ascolto per le connessioni');
    });
  } catch (error) {
    console.error('❌ Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
}

startServer();
