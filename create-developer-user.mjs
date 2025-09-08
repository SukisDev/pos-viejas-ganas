import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDeveloperUser() {
  try {
    console.log('🚀 Creando usuario developer...');
    
    // Verificar si ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'developer' },
          { email: 'gomjean44@gmail.com' }
        ]
      }
    });

    if (existingUser) {
      console.log('👤 Usuario developer ya existe. Actualizando...');
      
      const hashedPassword = await bcrypt.hash('dev123456', 12);
      
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: 'developer',
          name: 'Developer',
          email: 'gomjean44@gmail.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          active: true,
          resetToken: null,
          resetTokenExp: null
        }
      });
      
      console.log('✅ Usuario developer actualizado:', {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      console.log('👤 Creando nuevo usuario developer...');
      
      const hashedPassword = await bcrypt.hash('dev123456', 12);
      
      const newUser = await prisma.user.create({
        data: {
          username: 'developer',
          name: 'Developer',
          email: 'gomjean44@gmail.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          active: true
        }
      });
      
      console.log('✅ Usuario developer creado:', {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });
    }
    
    console.log('\n📋 Credenciales:');
    console.log('   Username: developer');
    console.log('   Password: dev123456');
    console.log('   Email: gomjean44@gmail.com');
    console.log('   Rol: ADMIN');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDeveloperUser();
