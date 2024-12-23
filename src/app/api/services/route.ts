import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET /api/services
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barbiereId = searchParams.get('barbiereId');

    console.log('GET /api/services - barbiereId:', barbiereId);

    let servizi;
    if (barbiereId) {
      // Se è specificato un barbiere, restituisci solo i suoi servizi
      servizi = await prisma.servizio.findMany({
        where: {
          barbieri: {
            some: {
              barbiereId: parseInt(barbiereId)
            }
          }
        },
        include: {
          barbieri: {
            where: {
              barbiereId: parseInt(barbiereId)
            }
          }
        },
        orderBy: {
          nome: 'asc'
        }
      });

      console.log('Servizi trovati per il barbiere:', servizi);

      // Formatta i servizi per il frontend
      servizi = servizi.map(servizio => ({
        id: servizio.id,
        nome: servizio.nome,
        descrizione: servizio.descrizione,
        durata: servizio.durata,
        prezzo: servizio.barbieri[0]?.prezzo || servizio.prezzo,
        categoria: servizio.categoria
      }));
    } else {
      // Se non è specificato un barbiere, restituisci tutti i servizi
      servizi = await prisma.servizio.findMany({
        orderBy: {
          nome: 'asc'
        }
      });
    }

    console.log('Servizi trovati:', servizi);
    return NextResponse.json({ success: true, data: servizi });
  } catch (error) {
    console.error('Errore durante il recupero dei servizi:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante il recupero dei servizi' },
      { status: 500 }
    );
  }
}

// POST /api/services
export async function POST(req: Request) {
  console.log('[API] Inizio richiesta POST /api/services');
  try {
    const session = await getServerSession(authOptions);
    console.log('[API] Sessione utente:', session);

    if (!session || session.user.role !== 'ADMIN') {
      console.log('[API] Accesso non autorizzato');
      return NextResponse.json(
        { success: false, error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log('[API] Dati ricevuti dalla richiesta:', data);
    
    // Validazione base
    if (!data.nome || !data.descrizione || !data.durata || data.prezzo === undefined || !data.categoria) {
      console.log('[API] Validazione fallita - campi mancanti:', { data });
      return NextResponse.json(
        { success: false, error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    // Validazione aggiuntiva
    if (data.durata < 15 || data.durata > 240 || data.durata % 5 !== 0) {
      console.log('[API] Validazione fallita - durata non valida:', data.durata);
      return NextResponse.json(
        { success: false, error: 'La durata deve essere tra 15 e 240 minuti e deve essere multipla di 5' },
        { status: 400 }
      );
    }

    if (data.prezzo < 0.5 || data.prezzo > 1000) {
      console.log('[API] Validazione fallita - prezzo non valido:', data.prezzo);
      return NextResponse.json(
        { success: false, error: 'Il prezzo deve essere tra 0.50€ e 1000€' },
        { status: 400 }
      );
    }

    try {
      // Preparazione dati per Prisma con gestione esplicita del Decimal
      const serviceData = {
        nome: data.nome.trim(),
        descrizione: data.descrizione.trim(),
        durata: Number(data.durata),
        prezzo: new Prisma.Decimal(data.prezzo),
        categoria: data.categoria.trim().toUpperCase(),
        immagine: data.immagine
      };
      console.log('[API] Dati preparati per Prisma:', serviceData);

      // Creazione servizio
      const servizio = await prisma.servizio.create({
        data: serviceData
      });
      console.log('[API] Servizio creato con successo:', servizio);

      return NextResponse.json({ success: true, data: servizio });
    } catch (prismaError: any) {
      console.error('[API] Errore Prisma:', {
        error: prismaError,
        code: prismaError.code,
        message: prismaError.message
      });

      if (prismaError instanceof Prisma.PrismaClientKnownRequestError) {
        if (prismaError.code === 'P2002') {
          return NextResponse.json(
            { success: false, error: 'Esiste già un servizio con questo nome' },
            { status: 400 }
          );
        }
      }
      throw prismaError; // Rilancia l'errore per essere catturato dal catch esterno
    }
  } catch (error: any) {
    console.error('[API] Errore generale:', {
      error,
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { success: false, error: 'Errore nella creazione del servizio' },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id]
export async function PUT(req: Request) {
  console.log('[API] Inizio richiesta PUT /api/services');
  try {
    const session = await getServerSession(authOptions);
    console.log('[API] Sessione utente:', session);

    if (!session || session.user.role !== 'ADMIN') {
      console.log('[API] Accesso non autorizzato');
      return NextResponse.json(
        { success: false, error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID servizio mancante' },
        { status: 400 }
      );
    }

    const data = await req.json();
    console.log('[API] Dati ricevuti dalla richiesta:', data);
    
    // Validazione base
    if (!data.nome || !data.descrizione || !data.durata || data.prezzo === undefined || !data.categoria) {
      console.log('[API] Validazione fallita - campi mancanti:', { data });
      return NextResponse.json(
        { success: false, error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    // Validazione aggiuntiva
    if (data.durata < 15 || data.durata > 240 || data.durata % 5 !== 0) {
      console.log('[API] Validazione fallita - durata non valida:', data.durata);
      return NextResponse.json(
        { success: false, error: 'La durata deve essere tra 15 e 240 minuti e deve essere multipla di 5' },
        { status: 400 }
      );
    }

    if (data.prezzo < 0.5 || data.prezzo > 1000 || (data.prezzo * 2) % 1 !== 0) {
      console.log('[API] Validazione fallita - prezzo non valido:', data.prezzo);
      return NextResponse.json(
        { success: false, error: 'Il prezzo deve essere tra 0.50€ e 1000€ e deve essere multiplo di 0.50€' },
        { status: 400 }
      );
    }

    // Aggiorna il servizio
    const servizio = await prisma.servizio.update({
      where: { id: parseInt(id) },
      data: {
        nome: data.nome,
        descrizione: data.descrizione,
        durata: data.durata,
        prezzo: new Prisma.Decimal(data.prezzo),
        categoria: data.categoria
      }
    });

    console.log('[API] Servizio aggiornato:', servizio);
    return NextResponse.json({ success: true, data: servizio });
  } catch (error) {
    console.error('[API] Errore durante l\'aggiornamento del servizio:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante l\'aggiornamento del servizio' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id]
export async function DELETE(req: Request) {
  console.log('[API] Inizio richiesta DELETE /api/services');
  try {
    const session = await getServerSession(authOptions);
    console.log('[API] Sessione utente:', session);

    if (!session || session.user.role !== 'ADMIN') {
      console.log('[API] Accesso non autorizzato');
      return NextResponse.json(
        { success: false, error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID servizio mancante' },
        { status: 400 }
      );
    }

    // Elimina il servizio
    await prisma.servizio.delete({
      where: { id: parseInt(id) }
    });

    console.log('[API] Servizio eliminato con successo, ID:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Errore durante l\'eliminazione del servizio:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante l\'eliminazione del servizio' },
      { status: 500 }
    );
  }
}
