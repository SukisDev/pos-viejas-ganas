const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { businessDate: 'desc' },
    take: 10,
    select: {
      id: true,
      businessDate: true,
      number: true,
      createdAt: true
    }
  });
  
  console.log('Recent orders:');
  orders.forEach(order => {
    console.log(`Order ${order.number}: businessDate=${order.businessDate.toISOString()}, created=${order.createdAt.toISOString()}`);
  });
  
  // Verificar qué día es hoy en Panama
  const todayInPanama = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Panama' });
  console.log(`\nToday in Panama: ${todayInPanama}`);
  
  // Verificar órdenes de hoy
  const todayOrders = await prisma.order.findMany({
    where: {
      businessDate: {
        gte: new Date(`${todayInPanama}T05:00:00.000Z`),
        lte: new Date(`${todayInPanama.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => {
          const date = new Date(y, m-1, parseInt(d)+1);
          return date.toISOString().split('T')[0];
        })}T04:59:59.999Z`)
      }
    },
    select: {
      number: true,
      businessDate: true
    }
  });
  
  console.log(`\nOrders for today (${todayInPanama}):`);
  todayOrders.forEach(order => {
    console.log(`Order ${order.number}: ${order.businessDate.toISOString()}`);
  });
  
  await prisma.$disconnect();
}

checkOrders().catch(console.error);
