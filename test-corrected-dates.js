// Test de las funciones corregidas

function getPanamaDate() {
  const now = new Date();
  const panamaDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Panama' });
  return new Date(panamaDateStr + 'T00:00:00.000Z');
}

function getPanamaDateFromString(dateString) {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date;
}

console.log('=== TESTING CORRECTED FUNCTIONS ===');
console.log('Current date in Panama timezone:', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Panama' }));

const todayPanama = getPanamaDate();
console.log('\ngetPanamaDate() result:', todayPanama.toISOString());

const testDate = '2025-09-07';
const convertedDate = getPanamaDateFromString(testDate);
console.log(`\ngetPanamaDateFromString('${testDate}'):`, convertedDate.toISOString());

// Crear el rango de filtrado
const startOfDay = new Date(convertedDate);
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date(convertedDate);
endOfDay.setHours(23, 59, 59, 999);

console.log('\nFilter range:');
console.log('Start:', startOfDay.toISOString());
console.log('End:', endOfDay.toISOString());

// Verificar si las órdenes existentes caen en este rango
const existingOrderDates = [
  '2025-09-07T00:00:00.000Z',
  '2025-09-06T00:00:00.000Z'
];

console.log('\nTesting existing orders:');
existingOrderDates.forEach(dateStr => {
  const orderDate = new Date(dateStr);
  const inRange = orderDate >= startOfDay && orderDate <= endOfDay;
  console.log(`${dateStr}: ${inRange ? 'IN RANGE' : 'OUT OF RANGE'}`);
});
