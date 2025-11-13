// 🔐 SERVICIO DE RECUPERACIÓN DE CONTRASEÑA

import { conexion } from "../Models/Conexion.ts";
import { securityService } from "./SecurityService.ts";
import { emailService } from "./EmailService.ts";
import { Usuario, type UsuarioLoginData } from "../Models/UsuariosModel.ts";

export class PasswordRecoveryService {
  
  /**
   * Generar token de recuperación de contraseña
   */
  static async generateRecoveryToken(email: string, metodo: 'email' | 'sms' = 'email'): Promise<{
    success: boolean;
    message: string;
    token?: string;
    codigo_sms?: string;
    expiracion?: Date;
  }> {
    try {
      const userInstance = new Usuario();
      const usuario = await userInstance.buscarPorEmail(email);

      if (!usuario) {
        // Por seguridad, no revelamos si el email existe o no
        return {
          success: true,
          message: "Si el email existe, se enviará un enlace de recuperación."
        };
      }

      // Generar token único
      const token = await securityService.generateEmailVerificationHash(email + Date.now().toString());
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + 1); // Expira en 1 hora

      // Guardar token en la base de datos
      await conexion.execute(
        `INSERT INTO tokens_recuperacion 
         (id_usuario, token, fecha_expiracion) 
         VALUES (?, ?, ?)`,
        [usuario.id_usuario, token, fechaExpiracion]
      );

      if (metodo === 'email') {
        // Enviar email con enlace de recuperación
        await emailService.sendPasswordRecoveryEmail(
          usuario.email,
          usuario.nombre,
          token
        );

        return {
          success: true,
          message: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
          token: token,
          expiracion: fechaExpiracion
        };
      } else {
        // Método SMS no disponible - los campos SMS no existen en la BD
        // Se puede implementar en el futuro si se agregan los campos a la BD
        return {
          success: false,
          message: "El método SMS no está disponible actualmente. Por favor, usa el método de email."
        };
      }
    } catch (error) {
      console.error("Error generando token de recuperación:", error);
      return {
        success: false,
        message: "Error al generar token de recuperación."
      };
    }
  }

  /**
   * Validar token de recuperación
   */
  static async validateRecoveryToken(token: string): Promise<{
    success: boolean;
    valid: boolean;
    message: string;
    id_usuario?: number;
  }> {
    try {
      const result = await conexion.query(
        `SELECT tr.*, u.email, u.nombre
         FROM tokens_recuperacion tr
         INNER JOIN usuarios u ON tr.id_usuario = u.id_usuario
         WHERE tr.token = ? 
           AND tr.usado = 0
           AND tr.fecha_expiracion > NOW()`,
        [token]
      );

      if (result.length === 0) {
        return {
          success: true,
          valid: false,
          message: "Token inválido o expirado."
        };
      }

      const tokenData = result[0];
      return {
        success: true,
        valid: true,
        message: "Token válido.",
        id_usuario: tokenData.id_usuario
      };
    } catch (error) {
      console.error("Error validando token:", error);
      return {
        success: false,
        valid: false,
        message: "Error al validar token."
      };
    }
  }

  /**
   * Validar código SMS - NO DISPONIBLE (campos SMS no existen en BD)
   */
  static async validateSMSCode(email: string, codigo: string): Promise<{
    success: boolean;
    valid: boolean;
    message: string;
    id_usuario?: number;
  }> {
    // Método SMS no disponible - los campos SMS no existen en la BD
    return {
      success: false,
      valid: false,
      message: "El método SMS no está disponible actualmente."
    };
  }

  /**
   * Restablecer contraseña con token
   */
  static async resetPasswordWithToken(
    token: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validar token
      const validation = await this.validateRecoveryToken(token);
      if (!validation.valid || !validation.id_usuario) {
        return {
          success: false,
          message: "Token inválido o expirado."
        };
      }

      // Validar fortaleza de contraseña
      const passwordValidation = securityService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: "La contraseña no cumple con los requisitos de seguridad.",
        };
      }

      // Hash de nueva contraseña
      const hashedPassword = await securityService.hashPassword(newPassword);

      // Actualizar contraseña
      await conexion.execute(
        `UPDATE usuarios SET password = ? WHERE id_usuario = ?`,
        [hashedPassword, validation.id_usuario]
      );

      // Marcar token como usado
      await conexion.execute(
        `UPDATE tokens_recuperacion SET usado = 1 WHERE token = ?`,
        [token]
      );

      return {
        success: true,
        message: "Contraseña restablecida exitosamente."
      };
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      return {
        success: false,
        message: "Error al restablecer contraseña."
      };
    }
  }

  /**
   * Restablecer contraseña con código SMS
   */
  static async resetPasswordWithSMS(
    email: string,
    codigo: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validar código SMS
      const validation = await this.validateSMSCode(email, codigo);
      if (!validation.valid || !validation.id_usuario) {
        return {
          success: false,
          message: "Código inválido o expirado."
        };
      }

      // Validar fortaleza de contraseña
      const passwordValidation = securityService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: "La contraseña no cumple con los requisitos de seguridad.",
        };
      }

      // Hash de nueva contraseña
      const hashedPassword = await securityService.hashPassword(newPassword);

      // Actualizar contraseña
      await conexion.execute(
        `UPDATE usuarios SET password = ? WHERE id_usuario = ?`,
        [hashedPassword, validation.id_usuario]
      );

      return {
        success: true,
        message: "Contraseña restablecida exitosamente."
      };
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      return {
        success: false,
        message: "Error al restablecer contraseña."
      };
    }
  }

  // Nota: La tabla auditoria_acciones no existe en la BD actual
  // Se puede implementar en el futuro si se agrega la tabla
}











