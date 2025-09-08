import { randomBytes } from 'crypto';
import { PASSWORD_RESET_CONFIG } from '@/types/password-reset';

/**
 * Genera un token seguro para recuperación de contraseña
 * @returns Token hexadecimal de 32 bytes (256 bits)
 */
export function generateResetToken(): string {
  return randomBytes(PASSWORD_RESET_CONFIG.TOKEN_LENGTH).toString('hex');
}

/**
 * Genera la fecha de expiración para un token de reset
 * @returns Fecha de expiración (1 hora desde ahora)
 */
export function generateTokenExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
}

/**
 * Verifica si un token ha expirado
 * @param expiryDate Fecha de expiración del token
 * @returns true si el token ha expirado, false en caso contrario
 */
export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Valida que una contraseña cumpla con los requisitos mínimos
 * @param password Contraseña a validar
 * @returns Objeto con resultado de validación y mensaje de error si aplica
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }
  
  if (password.length < PASSWORD_RESET_CONFIG.MIN_PASSWORD_LENGTH) {
    return { 
      valid: false, 
      error: `La contraseña debe tener al menos ${PASSWORD_RESET_CONFIG.MIN_PASSWORD_LENGTH} caracteres` 
    };
  }
  
  // Aquí se pueden agregar más validaciones:
  // - Al menos una mayúscula
  // - Al menos un número
  // - Al menos un carácter especial
  // - No contener espacios al inicio o final
  // etc.
  
  return { valid: true };
}

/**
 * Sanitiza un username removiendo espacios y caracteres no permitidos
 * @param username Username a sanitizar
 * @returns Username sanitizado
 */
export function sanitizeUsername(username: string): string {
  return username
    .trim()
    .replace(/\s+/g, '') // Remover todos los espacios
    .toLowerCase(); // Convertir a minúsculas para consistencia
}
