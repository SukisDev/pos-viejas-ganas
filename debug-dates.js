// Script para debuggear las fechas de Panama

function getPanamaDate() {
  const now = new Date();
  const panama = new Date(now.toLocaleString('en-US', { timeZone: 'America/Panama' }));
  panama.setHours(0, 0, 0, 0);
  return panama;
}

function getPanamaDateFromString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  // Crear la fecha en zona de Panama
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  
  // Convertir a zona horaria de Panama
  const panamaDateStr = date.toLocaleString('en-US', { timeZone: 'America/Panama' });
  const panamaDate = new Date(panamaDateStr);
  panamaDate.setHours(0, 0, 0, 0);
  
  return panamaDate;
}

console.log('=== DEBUGGING PANAMA DATES ===');
console.log('Current date in system:', new Date().toString());
console.log('Current date in Panama timezone:', new Date().toLocaleString('en-US', { timeZone: 'America/Panama' }));

const todayPanama = getPanamaDate();
console.log('\ngetPanamaDate() result:', todayPanama.toString());
console.log('getPanamaDate() ISO:', todayPanama.toISOString());

const testDate = '2025-09-07';
const convertedDate = getPanamaDateFromString(testDate);
console.log(`\ngetPanamaDateFromString('${testDate}'):`);
console.log('Result:', convertedDate.toString());
console.log('ISO:', convertedDate.toISOString());

// Probemos la diferencia de zona horaria
const utcNow = new Date();
const panamaOffset = utcNow.getTimezoneOffset() + (5 * 60); // Panama es UTC-5
console.log('\nTimezone offset calculation:');
console.log('UTC now:', utcNow.toISOString());
console.log('System timezone offset (minutes):', utcNow.getTimezoneOffset());
console.log('Panama should be offset:', panamaOffset);

// Mejor método usando Intl
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Panama',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const todayInPanama = formatter.format(new Date());
console.log('\nUsing Intl.DateTimeFormat:');
console.log('Today in Panama timezone:', todayInPanama);
