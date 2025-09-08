// Tipos para el sistema de recuperación de contraseña

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  error?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  error?: string;
}

// Configuración para tokens de recuperación
export const PASSWORD_RESET_CONFIG = {
  TOKEN_EXPIRY_HOURS: 1, // Token expira en 1 hora
  TOKEN_LENGTH: 32, // 32 bytes = 256 bits
  MIN_PASSWORD_LENGTH: 6,
} as const;
