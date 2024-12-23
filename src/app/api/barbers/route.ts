import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Recupera tutti i barbieri con i loro dati utente
    const barbers = await prisma.barbiere.findMany({
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
            fotoProfilo: true
          }
        }
      },
      where: {
        utente: {
          ruolo: 'BARBIERE'
        }
      }
    });

    // Log per debug
    console.log('Barbieri trovati:', barbers);

    return NextResponse.json({
      success: true,
      data: barbers
    });

  } catch (error) {
    console.error('Errore durante il recupero dei barbieri:', error);
    return NextResponse.json(
      { success: false, message: 'Errore durante il recupero dei barbieri' },
      { status: 500 }
    );
  }
}
