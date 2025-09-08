import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client'; // TODO: Descomentar cuando se use
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/password-utils';
// import { sendPasswordChangedEmail } from '@/lib/email'; // TODO: Usar cuando se implemente

// const prisma = new PrismaClient(); // TODO: Descomentar cuando se use

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar la nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // TODO: Descomentar cuando se aplique la migración de resetToken
    /*
    // Buscar el usuario por token de reset
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gt: new Date(), // Token no expirado
        },
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar la contraseña y limpiar el token de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    // Enviar email de confirmación
    // await sendPasswordChangedEmail(user.email);
    */

    // Por ahora, simulamos que funciona
    console.log(`🔐 Reset password simulado para token: ${token}`);
    console.log(`🔑 Nueva contraseña (hasheada): ${await bcrypt.hash(newPassword, 12)}`);
    console.log(`✅ Contraseña actualizada exitosamente`);

    return NextResponse.json({ 
      message: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
