import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notifications - Ottieni tutte le notifiche dell'utente
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    // Verifica che l'utente esista
    const user = await prisma.utente.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const notifications = await prisma.notifica.findMany({
      where: {
        utenteId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Errore nel recupero delle notifiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle notifiche'
    });
  }
});

// POST /api/notifications/:id/read - Marca una notifica come letta
router.post('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verifica che la notifica appartenga all'utente
    const notification = await prisma.notifica.findFirst({
      where: {
        id,
        utenteId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notifica non trovata'
      });
    }

    // Aggiorna lo stato della notifica
    await prisma.notifica.update({
      where: { id },
      data: { letta: true }
    });

    res.json({
      success: true,
      message: 'Notifica aggiornata con successo'
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della notifica:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento della notifica'
    });
  }
});

// DELETE /api/notifications/all - Elimina tutte le notifiche lette dell'utente
router.delete('/all', authenticateToken, async (req: any, res) => {
  try {
    // Verifica che l'utente esista
    const user = await prisma.utente.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    await prisma.notifica.deleteMany({
      where: {
        utenteId: req.user.id,
        letta: true
      }
    });

    res.json({
      success: true,
      message: 'Notifiche eliminate con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione delle notifiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione delle notifiche'
    });
  }
});

// Funzione di utilità per creare una nuova notifica
export const createNotification = async (
  utenteId: string,
  tipo: 'PRENOTAZIONE' | 'PUNTI' | 'SISTEMA',
  messaggio: string
) => {
  try {
    const notification = await prisma.notifica.create({
      data: {
        utenteId,
        tipo,
        messaggio
      }
    });
    return notification;
  } catch (error) {
    console.error('Errore nella creazione della notifica:', error);
    throw error;
  }
};

export default router;
