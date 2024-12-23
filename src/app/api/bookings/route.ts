import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni dati dalla richiesta
    const data = await request.json();
    const { barber_id, service_ids, date_time } = data;

    // Validazione dati
    if (!barber_id || !service_ids || !date_time || !Array.isArray(service_ids)) {
      return NextResponse.json(
        { success: false, message: 'Dati mancanti o non validi' },
        { status: 400 }
      );
    }

    // Trova l'utente dal database
    const user = await prisma.utente.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Crea la prenotazione
    const booking = await prisma.prenotazione.create({
      data: {
        dataOra: new Date(date_time),
        barbiereId: barber_id,
        clienteId: user.id,
        servizi: {
          create: service_ids.map(serviceId => ({
            servizioId: serviceId
          }))
        },
        stato: 'CONFERMATA'
      },
      include: {
        servizi: {
          include: {
            servizio: true
          }
        },
        barbiere: {
          include: {
            utente: true
          }
        }
      }
    });

    // Log per debug
    console.log('Prenotazione creata:', booking);

    return NextResponse.json({
      success: true,
      message: 'Prenotazione creata con successo',
      data: booking
    });

  } catch (error) {
    console.error('Errore durante la creazione della prenotazione:', error);
    return NextResponse.json(
      { success: false, message: 'Errore durante la creazione della prenotazione' },
      { status: 500 }
    );
  }
}
