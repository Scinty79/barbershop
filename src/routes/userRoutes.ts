import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint per l'upload dell'immagine del profilo
router.post('/:userId/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato'
      });
    }

    // Costruisci il percorso relativo dell'immagine
    const relativePath = path.join('uploads/profile-images', req.file.filename);

    // Aggiorna il percorso dell'immagine nel database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fotoProfilo: relativePath
      }
    });

    res.json({
      success: true,
      data: {
        fotoProfilo: relativePath
      }
    });
  } catch (error) {
    console.error('Errore durante l\'upload dell\'immagine:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'upload dell\'immagine'
    });
  }
});

// Endpoint per ottenere i dettagli di un utente
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Errore durante il recupero dei dati utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei dati utente'
    });
  }
});

// Endpoint per aggiornare i dati di un utente
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dei dati utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento dei dati utente'
    });
  }
});

export default router;
