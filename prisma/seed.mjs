// prisma/seed.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('Falta DIRECT_URL o DATABASE_URL en el .env');
}
process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient({ datasourceUrl: dbUrl });

async function ensureUser(username, password, role) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role },
    create: { username, passwordHash, role },
  });
}

async function main() {
  await ensureUser('admin', 'admin123', 'ADMIN');
  await ensureUser('caja', 'caja123', 'CASHIER');
  await ensureUser('chef', 'chef123', 'CHEF');

  // Limpiar en orden correcto (foreign keys)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dailyCounter.deleteMany();
  await prisma.beeper.deleteMany();
  await prisma.product.deleteMany();

  await prisma.beeper.createMany({
    data: Array.from({ length: 18 }, (_, i) => ({
      id: i + 1,
      status: 'AVAILABLE',
    })),
  });

  const products = [
    // QUESADILLAS
    { name: 'Quesadilla Carne', price: 6.0, category: 'Quesadillas' },
    { name: 'Quesadilla Pollo', price: 6.0, category: 'Quesadillas' },
    { name: 'Quesadillas Birria', price: 7.0, category: 'Quesadillas' },

    // POLLO
    { name: 'Chicken Tender', price: 5.5, category: 'Pollo' },
    { name: 'Alitas', price: 5.5, category: 'Pollo' },

    // NACHOS
    { name: 'Nachos Carne o Pollo', price: 6.0, category: 'Nachos' },

    // HAMBURGUESAS Y SANDWICHES
    { name: 'VSC Burger', price: 5.0, category: 'Hamburguesas y Sandwiches' },
    { name: 'Chicken Burger', price: 5.0, category: 'Hamburguesas y Sandwiches' },
    { name: 'Buffalo Chicken Burger', price: 5.75, category: 'Hamburguesas y Sandwiches' },
    { name: 'BBQ Chicken Burger', price: 6.0, category: 'Hamburguesas y Sandwiches' },
    { name: 'BBQ Pulled Pork Sandwich', price: 7.5, category: 'Hamburguesas y Sandwiches' },
    { name: 'Choripán', price: 3.0, category: 'Hamburguesas y Sandwiches' },

    // SPECIAL FRIES
    { name: 'Salchipapas', price: 4.0, category: 'Special Fries' },
    { name: 'Choripapas', price: 4.0, category: 'Special Fries' },
    { name: 'BBQ Pulled Pork Fries', price: 5.5, category: 'Special Fries' },
    { name: 'Tex Mex Chicken Fries', price: 4.0, category: 'Special Fries' },
    { name: 'Bacon Chicken Fries', price: 4.0, category: 'Special Fries' },

    // SUNDAY MENU
    { name: 'Hot Dog', price: 2.5, category: 'Sunday Menu' },
    { name: 'Hot Dog con Queso', price: 2.75, category: 'Sunday Menu' },
    { name: 'Hot Dog Texano', price: 3.5, category: 'Sunday Menu' },
    { name: 'Hot Dog Mexicano', price: 4.0, category: 'Sunday Menu' },

    // ADD ONS (temporal como productos)
    { name: 'Bacon & Onions', price: 2.0, category: 'Add Ons' },
    { name: 'Queso Mexicano', price: 1.0, category: 'Add Ons' },
    { name: 'Coleslaw (add)', price: 0.75, category: 'Add Ons' },
    { name: 'Aguacate', price: 0.75, category: 'Add Ons' },

    // ACOMPAÑAMIENTOS
    { name: 'Aros de Cebolla', price: 2.5, category: 'Acompañamientos' },
    { name: 'Papas Fritas', price: 1.0, category: 'Acompañamientos' },
    { name: 'Jalapeño Popper', price: 3.5, category: 'Acompañamientos' },
    { name: 'Coleslaw (acompañ.)', price: 1.0, category: 'Acompañamientos' },

    // BEBIDAS — CERVEZAS
    { name: 'Cerveza', price: 1.25, category: 'Bebidas - Cervezas' },

    // BEBIDAS — TRAGOS
    { name: 'Seco (trago)', price: 3.0, category: 'Bebidas - Tragos' },
    { name: 'Gin/Ron/Vodka (trago)', price: 4.0, category: 'Bebidas - Tragos' },
    { name: 'Aperol Spritz', price: 5.0, category: 'Bebidas - Tragos' },

    // BEBIDAS — SODAS
    { name: 'Soda 6.5oz', price: 0.75, category: 'Bebidas - Sodas' },
    { name: 'Soda 12oz', price: 1.0, category: 'Bebidas - Sodas' },
    { name: 'Soda (lata)', price: 1.25, category: 'Bebidas - Sodas' },

    // BEBIDAS — ISOTÓNICOS
    { name: 'Powerade', price: 1.0, category: 'Bebidas - Isotónicos' },
    { name: 'Gatorade', price: 1.5, category: 'Bebidas - Isotónicos' },

    // BEBIDAS — AGUA
    { name: 'Agua', price: 1.0, category: 'Bebidas - Agua' },
    { name: 'Agua Saborizada', price: 1.25, category: 'Bebidas - Agua' },

    // BEBIDAS — JUGOS Y TÉ
    { name: 'Té Frío', price: 1.0, category: 'Bebidas - Jugos y Té' },
    { name: 'Jugo Del Valle', price: 0.75, category: 'Bebidas - Jugos y Té' },
  ];

  await prisma.product.createMany({ data: products });

  console.log('Seed OK ✓');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
