// Test final de las funciones

function getPanamaDateFromString(dateString) {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date;
}

console.log('=== FINAL TEST ===');

const testDate = '2025-09-07';
const panamaDate = getPanamaDateFromString(testDate);

const startOfDay = new Date(panamaDate.getTime());
const endOfDay = new Date(panamaDate.getTime() + (24 * 60 * 60 * 1000) - 1);

console.log(`Test date: ${testDate}`);
console.log(`Panama date: ${panamaDate.toISOString()}`);
console.log(`Start of day: ${startOfDay.toISOString()}`);
console.log(`End of day: ${endOfDay.toISOString()}`);

// Verificar si las órdenes existentes caen en este rango
const existingOrderDates = [
  '2025-09-07T00:00:00.000Z',
  '2025-09-06T00:00:00.000Z'
];

console.log('\nTesting existing orders:');
existingOrderDates.forEach(dateStr => {
  const orderDate = new Date(dateStr);
  const inRange = orderDate >= startOfDay && orderDate <= endOfDay;
  console.log(`${dateStr}: ${inRange ? 'IN RANGE ✓' : 'OUT OF RANGE ✗'}`);
});
