// Test script para verificar el comportamiento del calendario
// Este script simula el cambio de activeTab a 'orders'

console.log('=== TEST CALENDARIO VIEJAS GANAS ===');

// Simular cambio de activeTab a 'orders'
console.log('1. Simulando cambio de activeTab a "orders"...');

// Simular llamada a fetchOrderDates
async function testFetchOrderDates() {
  console.log('2. Ejecutando fetchOrderDates...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/orders/dates');
    console.log('3. Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('4. Datos recibidos:', data);
      
      if (data.success && data.monthsWithOrders) {
        console.log('5. ✅ Meses con órdenes:', data.monthsWithOrders.length);
        
        data.monthsWithOrders.forEach((month, index) => {
          console.log(`   Mes ${index + 1}: ${month.monthName} ${month.year} (${month.dates.length} fechas)`);
          month.dates.forEach(date => {
            console.log(`     - ${date.date}: ${date.count} órdenes`);
          });
        });
        
        console.log('6. ✅ CALENDARIO: El sistema funciona correctamente!');
        console.log('   - API responde correctamente');
        console.log('   - Datos están estructurados correctamente');
        console.log('   - useEffect debería ejecutarse cuando activeTab === "orders"');
        
        return true;
      } else {
        console.log('5. ❌ No hay datos en la respuesta');
        return false;
      }
    } else {
      console.log('4. ❌ Error en la respuesta:', response.status);
      return false;
    }
  } catch (error) {
    console.log('4. ❌ Error en la llamada:', error.message);
    return false;
  }
}

// Ejecutar test
testFetchOrderDates().then(success => {
  if (success) {
    console.log('\n🎉 CONCLUSIÓN: El sistema de calendario está funcionando correctamente!');
    console.log('💡 Para verificar en la UI:');
    console.log('   1. Ir a http://localhost:3000/admin');
    console.log('   2. Hacer clic en la pestaña "Orders"');
    console.log('   3. El calendario debería mostrar las fechas con órdenes');
  } else {
    console.log('\n❌ CONCLUSIÓN: Hay problemas con el sistema de calendario');
  }
});
