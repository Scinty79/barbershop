import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middlewares/auth';
import { logger } from '../../lib/logger';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/bookings - Crea una nuova prenotazione
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { barbiereId, servizi, data, ora, note } = req.body;

    logger.info('Richiesta creazione prenotazione ricevuta', {
      userId: req.user.id,
      barbiereId,
      servizi,
      data,
      ora,
      note,
      body: req.body
    });

    // Verifica che l'utente esista
    const user = await prisma.utente.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      logger.warn('Utente non trovato', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    logger.debug('Utente trovato', { user });

    // Verifica che il barbiere esista
    const barbiere = await prisma.barbiere.findFirst({
      where: { id: barbiereId.toString() }
    });

    if (!barbiere) {
      logger.warn('Barbiere non trovato', { barbiereId });
      return res.status(404).json({
        success: false,
        error: 'Barbiere non trovato'
      });
    }

    logger.debug('Barbiere trovato', { barbiere });

    // Verifica che i servizi esistano
    const serviziDb = await prisma.servizio.findMany({
      where: {
        id: {
          in: servizi.map(String)
        }
      }
    });

    logger.debug('Servizi trovati', { serviziDb });

    if (serviziDb.length !== servizi.length) {
      logger.warn('Alcuni servizi non trovati', { 
        richiesti: servizi,
        trovati: serviziDb.map(s => s.id)
      });
      return res.status(404).json({
        success: false,
        error: 'Uno o più servizi non trovati'
      });
    }

    // Crea la prenotazione
    logger.debug('Tentativo creazione prenotazione', {
      dataOra: new Date(`${data}T${ora}`),
      note: note || '',
      utenteId: req.user.id,
      barbiereId: barbiere.id,
      servizi: serviziDb.map(servizio => ({
        servizioId: servizio.id,
        prezzo: servizio.prezzo
      }))
    });

    const prenotazione = await prisma.prenotazione.create({
      data: {
        dataOra: new Date(`${data}T${ora}`),
        note: note || '',
        utenteId: req.user.id,
        barbiereId: barbiere.id,
        servizi: {
          create: serviziDb.map(servizio => ({
            servizioId: servizio.id,
            prezzo: servizio.prezzo
          }))
        },
        stato: 'CONFERMATA'
      },
      include: {
        servizi: {
          include: {
            servizio: true
          }
        }
      }
    });

    logger.info('Prenotazione creata con successo', { 
      prenotazioneId: prenotazione.id 
    });

    res.json({
      success: true,
      bookingId: prenotazione.id,
      message: 'Prenotazione creata con successo'
    });

  } catch (error) {
    logger.error('Errore durante la creazione della prenotazione', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Si è verificato un errore durante la prenotazione'
    });
  }
});

export default router;
