// src/app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db'; // ruta relativa desde src/app/api/menu

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type MenuResponse = {
  categories: Array<{
    name: string;
    items: MenuItem[];
  }>;
};

export async function GET() {
  // Trae productos activos, ordenados por categoría y nombre
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  // Agrupa por categoría (si no tiene, la ponemos como "Sin categoría")
  const byCat = new Map<string, MenuItem[]>();
  for (const p of products) {
    const cat = p.category?.trim() || 'Sin categoría';
    const item: MenuItem = {
      id: p.id,
      name: p.name,
      // Prisma Decimal -> number para JSON limpio
      price: Number(p.price),
      category: cat,
    };
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(item);
  }

  const payload: MenuResponse = {
    categories: Array.from(byCat.entries()).map(([name, items]) => ({ name, items })),
  };

  return NextResponse.json(payload, { status: 200 });
}
