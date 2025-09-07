// Test script para verificar el comportamiento del calendario
// Este script simula el cambio de activeTab a 'orders'

console.log('=== TEST CALENDARIO VIEJAS GANAS ===');

// Test 1: Cargar fechas disponibles
async function testFetchOrderDates() {
  console.log('1. Probando fetchOrderDates...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/orders/dates');
    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Fechas disponibles:', data.monthsWithOrders.length, 'meses');
      
      data.monthsWithOrders.forEach((month, index) => {
        console.log(`     Mes ${index + 1}: ${month.monthName} ${month.year} (${month.dates.length} fechas)`);
        month.dates.forEach(date => {
          console.log(`       - ${date.date}: ${date.count} órdenes`);
        });
      });
      
      return data.monthsWithOrders;
    } else {
      console.log('   ❌ Error en la respuesta:', response.status);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Error en la llamada:', error.message);
    return null;
  }
}

// Test 2: Probar cargar órdenes por fecha específica
async function testFetchOrdersForDate(date) {
  console.log(`\n2. Probando fetchOrders para fecha: ${date}...`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/orders?date=${date}`);
    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Órdenes encontradas:', data.orders.length);
      
      data.orders.forEach((order, index) => {
        console.log(`     Orden ${index + 1}: #${order.number}`);
        console.log(`       Fecha: ${new Date(order.businessDate).toISOString()}`);
        console.log(`       Total: $${order.total}`);
        console.log(`       Items: ${order.items.length}`);
        
        order.items.forEach(item => {
          console.log(`         - ${item.qty}x ${item.product?.name || 'Sin nombre'} ($${item.unitPrice} c/u = $${item.lineTotal})`);
        });
      });
      
      return data.orders;
    } else {
      console.log('   ❌ Error en la respuesta:', response.status);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Error en la llamada:', error.message);
    return null;
  }
}

// Ejecutar tests
(async function runTests() {
  const dates = await testFetchOrderDates();
  
  if (dates && dates.length > 0) {
    // Probar con la primera fecha disponible
    const firstDate = dates[0].dates[0].date;
    await testFetchOrdersForDate(firstDate);
    
    // Probar con otra fecha si está disponible
    if (dates[0].dates.length > 1) {
      const secondDate = dates[0].dates[1].date;
      await testFetchOrdersForDate(secondDate);
    }
  }
  
  console.log('\n🔍 RESUMEN DE PRUEBAS:');
  console.log('   Si ves las órdenes correctas para cada fecha, el problema está resuelto.');
  console.log('   Si los totales son correctos (2x$6.00 = $12.00), el cálculo está arreglado.');
})();
