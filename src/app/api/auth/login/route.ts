import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Log per debug
    console.log('Login attempt for:', email);

    // Validazione input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e password sono richiesti' },
        { status: 400 }
      );
    }

    // Trova l'utente
    const user = await prisma.utente.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        nome: true,
        cognome: true,
        ruolo: true,
        fotoProfilo: true,
        punti: true
      }
    });

    // Log per debug
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Verifica password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    // Log per debug
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Genera token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.ruolo
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Rimuovi la password dai dati utente
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore durante il login' },
      { status: 500 }
    );
  }
}
