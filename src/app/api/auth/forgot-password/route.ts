import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateResetToken, generateTokenExpiry } from '@/lib/password-utils';
import { sendPasswordResetEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Buscar usuario administrador por email
    const user = await prisma.user.findFirst({
      where: { 
        email: cleanEmail,
        role: 'ADMIN', // Solo administradores pueden recuperar contraseña por email
        active: true
      },
    });

    console.log(`📧 Solicitud de recuperación para email: ${cleanEmail}`);

    if (!user) {
      // Verificar si el email existe pero no es admin o no está activo
      const anyUserWithEmail = await prisma.user.findFirst({
        where: { email: cleanEmail }
      });

      if (anyUserWithEmail) {
        if (anyUserWithEmail.role !== 'ADMIN') {
          return NextResponse.json({ 
            error: 'Este email no está vinculado a un usuario administrador. Solo los administradores pueden recuperar su contraseña por email.' 
          }, { status: 400 });
        } else if (!anyUserWithEmail.active) {
          return NextResponse.json({ 
            error: 'Este email está vinculado a un usuario desactivado.' 
          }, { status: 400 });
        }
      }
      
      // Si no se encontró usuario o cualquier otro caso, devolver error genérico
      return NextResponse.json({ 
        error: 'Este email no está vinculado al sistema.' 
      }, { status: 400 });
    }

    // En este punto user ya no puede ser null
    const resetToken = generateResetToken();
    const resetTokenExp = generateTokenExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
      },
    });

    console.log(`🔐 Token de recuperación para ${cleanEmail}: ${resetToken}`);
    console.log(`🔗 Enlace: http://localhost:3000/reset-password?token=${resetToken}`);
    console.log(`⏰ Expira: ${resetTokenExp.toISOString()}`);
    
    // Enviar email real
    try {
      await sendPasswordResetEmail(user.email!, resetToken);
      console.log('📧 Email de recuperación enviado exitosamente');
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
      // Aún así devolvemos éxito para no revelar problemas internos
      return NextResponse.json({ 
        message: 'Se han enviado las instrucciones de recuperación a tu email.' 
      });
    }

    return NextResponse.json({ 
      message: 'Se han enviado las instrucciones de recuperación a tu email.' 
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
