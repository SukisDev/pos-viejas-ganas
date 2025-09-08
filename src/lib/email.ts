import nodemailer from 'nodemailer';

// Configuración del transportador de email
const createTransporter = () => {
  // Para Gmail y otros servicios
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App Password para Gmail
      },
    });
  }
  
  // Para servicios SMTP personalizados
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
      auth: {
        user: process.env.ETHEREAL_USER || process.env.SMTP_USER,
        pass: process.env.ETHEREAL_PASS || process.env.SMTP_PASSWORD,
      },
    });
  }
  
  // Fallback para desarrollo/testing con Ethereal Email (emails falsos)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'ethereal.pass',
    },
  });
};

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Viejas Ganas POS',
        address: process.env.EMAIL_FROM || 'noreply@viejasganas.com'
      },
      to: email,
      subject: '🔐 Recuperación de Contraseña - Viejas Ganas POS',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de Contraseña</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #8DFF50;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .reset-button {
              display: inline-block;
              background-color: #8DFF50;
              color: #333;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .reset-button:hover {
              background-color: #7CE840;
            }
            .expiry-notice {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px;">🍽️ Viejas Ganas POS</div>
              <div style="color: #666; font-size: 16px;">Sistema de Punto de Venta</div>
            </div>
            
            <h2 style="text-align: center; color: #333;">Recuperación de Contraseña</h2>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema Viejas Ganas POS.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">🔐 Restablecer Contraseña</a>
            </div>
            
            <div class="expiry-notice">
              <p style="color: #856404; margin: 0;"><strong>⏰ Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;">${resetUrl}</p>
            
            <p style="color: #666; font-size: 14px;"><strong>¿No solicitaste este cambio?</strong> Puedes ignorar este email. Tu contraseña no será cambiada.</p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>Este email fue generado automáticamente por el sistema Viejas Ganas POS</p>
              <p>© 2025 - Sistema desarrollado para Viejas Ganas</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
🔐 Recuperación de Contraseña - Viejas Ganas POS

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema Viejas Ganas POS.

Para restablecer tu contraseña, visita este enlace:
${resetUrl}

⏰ IMPORTANTE: Este enlace expirará en 1 hora por motivos de seguridad.

¿No solicitaste este cambio? Puedes ignorar este email. Tu contraseña no será cambiada.

---
Este email fue generado automáticamente por el sistema Viejas Ganas POS
© 2025 - Sistema desarrollado para Viejas Ganas
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de recuperación enviado:');
    console.log(`📧 Para: ${email}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    
    // Si es Ethereal, mostrar URL de preview
    if (process.env.EMAIL_SERVICE === 'ethereal' || process.env.SMTP_HOST === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Vista previa del email: ${previewUrl}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    throw new Error(`Error al enviar email de recuperación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Configuración de email válida');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de email:', error);
    return false;
  }
}

export async function sendPasswordChangedEmail(email: string): Promise<void> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Viejas Ganas POS',
        address: process.env.EMAIL_FROM || 'noreply@viejasganas.com'
      },
      to: email,
      subject: '✅ Contraseña Actualizada - Viejas Ganas POS',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contraseña Actualizada</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #8DFF50;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .success-icon {
              width: 60px;
              height: 60px;
              background-color: #d4edda;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 20px auto;
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px;">🍽️ Viejas Ganas POS</div>
              <div style="color: #666; font-size: 16px;">Sistema de Punto de Venta</div>
            </div>
            
            <div class="success-icon">✅</div>
            
            <h2 style="text-align: center; color: #333;">Contraseña Actualizada</h2>
            
            <p>Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #0c5460; margin: 0;"><strong>🔒 Seguridad:</strong> Si no realizaste este cambio, contacta inmediatamente con el administrador del sistema.</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>Este email fue generado automáticamente por el sistema Viejas Ganas POS</p>
              <p>© 2025 - Sistema desarrollado para Viejas Ganas</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `✅ Contraseña Actualizada - Viejas Ganas POS

Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.

🔒 SEGURIDAD: Si no realizaste este cambio, contacta inmediatamente con el administrador del sistema.

---
Este email fue generado automáticamente por el sistema Viejas Ganas POS
© 2025 - Sistema desarrollado para Viejas Ganas`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de confirmación enviado:');
    console.log(`📧 Para: ${email}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
    throw new Error(`Error al enviar email de confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
