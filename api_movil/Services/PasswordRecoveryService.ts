// 🔐 SERVICIO DE RECUPERACIÓN DE CONTRASEÑA

import { conexion } from "../Models/Conexion.ts";
import { securityService } from "./SecurityService.ts";
import { emailService } from "./EmailService.ts";
import { Usuario, type UsuarioLoginData } from "../Models/UsuariosModel.ts";

export class PasswordRecoveryService {
  
  /**
   * Generar código de recuperación de contraseña (6 dígitos)
   */
  static generateRecoveryCode(): string {
    // Generar código de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generar token de recuperación de contraseña
   */
  static async generateRecoveryToken(email: string, metodo: 'email' | 'sms' = 'email'): Promise<{
    success: boolean;
    message: string;
    token?: string;
    codigo?: string;
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
          message: "Si el email existe, se enviará un código de recuperación."
        };
      }

      // Generar código de 6 dígitos
      const codigo = this.generateRecoveryCode();
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + 1); // Expira en 1 hora

      console.log(`📧 Generando código de recuperación para: ${email}`);
      console.log(`📧 Código generado: "${codigo}" (tipo: ${typeof codigo}, longitud: ${codigo.length})`);
      console.log(`📧 Expira en: ${fechaExpiracion.toISOString()}`);

      // Marcar códigos anteriores como usados (solo mantener el más reciente)
      const updateResult = await conexion.execute(
        `UPDATE tokens_recuperacion 
         SET usado = 1 
         WHERE id_usuario = ? AND usado = 0`,
        [usuario.id_usuario]
      );
      console.log(`🗑️ Códigos anteriores marcados como usados: ${updateResult.affectedRows || 0}`);

      // Guardar código en la base de datos (usando el campo token para almacenar el código)
      // Asegurarse de que se guarde como string y sin espacios
      const codigoParaGuardar = codigo.toString().trim();
      const insertResult = await conexion.execute(
        `INSERT INTO tokens_recuperacion 
         (id_usuario, token, fecha_expiracion) 
         VALUES (?, ?, ?)`,
        [usuario.id_usuario, codigoParaGuardar, fechaExpiracion]
      );

      console.log(`✅ Código guardado en base de datos (ID: ${insertResult.lastInsertId})`);
      
      // Verificar que se guardó correctamente
      const verificar = await conexion.query(
        `SELECT token, fecha_expiracion FROM tokens_recuperacion WHERE id_token = ?`,
        [insertResult.lastInsertId]
      );
      if (verificar.length > 0) {
        console.log(`✅ Verificación: Código en BD: "${verificar[0].token}" (longitud: ${verificar[0].token.length})`);
      }

      if (metodo === 'email') {
        // Enviar email con código de recuperación
        await emailService.sendPasswordRecoveryCode(
          usuario.email,
          usuario.nombre,
          codigo
        );

        return {
          success: true,
          message: "Se ha enviado un código de recuperación a tu correo electrónico.",
          codigo: codigo,
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
      console.error("Error generando código de recuperación:", error);
      return {
        success: false,
        message: "Error al generar código de recuperación."
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
   * Validar código de recuperación por email
   */
  static async validateRecoveryCode(email: string, codigo: string): Promise<{
    success: boolean;
    valid: boolean;
    message: string;
    id_usuario?: number;
    token?: string;
  }> {
    try {
      // Limpiar el código: quitar espacios y convertir a string
      const codigoLimpio = codigo.toString().trim().replace(/\s/g, '');
      
      console.log(`🔍 Validando código para email: ${email}`);
      console.log(`🔍 Código recibido: "${codigo}" (limpio: "${codigoLimpio}")`);

      // Buscar usuario por email
      const userInstance = new Usuario();
      const usuario = await userInstance.buscarPorEmail(email);

      if (!usuario) {
        console.log(`❌ Usuario no encontrado para email: ${email}`);
        return {
          success: true,
          valid: false,
          message: "Código inválido o expirado."
        };
      }

      console.log(`✅ Usuario encontrado: ID ${usuario.id_usuario}`);

      // Buscar TODOS los códigos activos para este usuario (para debugging)
      const todosLosCodigos = await conexion.query(
        `SELECT tr.*, u.email, u.nombre
         FROM tokens_recuperacion tr
         INNER JOIN usuarios u ON tr.id_usuario = u.id_usuario
         WHERE tr.id_usuario = ?
           AND tr.usado = 0
           AND tr.fecha_expiracion > NOW()
         ORDER BY tr.fecha_creacion DESC`,
        [usuario.id_usuario]
      );

      console.log(`📋 Códigos activos encontrados: ${todosLosCodigos.length}`);
      todosLosCodigos.forEach((cod: any, idx: number) => {
        console.log(`   ${idx + 1}. Token: "${cod.token}" (tipo: ${typeof cod.token})`);
      });

      // Buscar código en la base de datos - usar comparación directa de string
      // Primero intentar con comparación exacta
      let result = await conexion.query(
        `SELECT tr.*, u.email, u.nombre, 
                NOW() as ahora,
                tr.fecha_expiracion as expira
         FROM tokens_recuperacion tr
         INNER JOIN usuarios u ON tr.id_usuario = u.id_usuario
         WHERE tr.id_usuario = ?
           AND tr.token = ?
           AND tr.usado = 0`,
        [usuario.id_usuario, codigoLimpio]
      );

      console.log(`🔍 Resultados de búsqueda (sin verificar expiración): ${result.length}`);
      
      if (result.length > 0) {
        const tokenData = result[0];
        const ahora = new Date(tokenData.ahora);
        const expira = new Date(tokenData.expira);
        
        console.log(`⏰ Ahora: ${ahora.toISOString()}`);
        console.log(`⏰ Expira: ${expira.toISOString()}`);
        console.log(`⏰ Diferencia: ${(expira.getTime() - ahora.getTime()) / 1000} segundos`);
        
        // Verificar expiración manualmente (más flexible con zonas horarias)
        if (expira > ahora) {
          console.log(`✅ Código válido encontrado y no expirado`);
          return {
            success: true,
            valid: true,
            message: "Código válido.",
            id_usuario: tokenData.id_usuario,
            token: tokenData.token
          };
        } else {
          console.log(`❌ Código encontrado pero expirado`);
          return {
            success: true,
            valid: false,
            message: "Código expirado. Solicita uno nuevo."
          };
        }
      }

      // Si no se encontró, intentar con TRIM por si hay espacios en la BD
      result = await conexion.query(
        `SELECT tr.*, u.email, u.nombre,
                NOW() as ahora,
                tr.fecha_expiracion as expira
         FROM tokens_recuperacion tr
         INNER JOIN usuarios u ON tr.id_usuario = u.id_usuario
         WHERE tr.id_usuario = ?
           AND TRIM(tr.token) = ?
           AND tr.usado = 0`,
        [usuario.id_usuario, codigoLimpio]
      );

      console.log(`🔍 Resultados con TRIM: ${result.length}`);

      if (result.length > 0) {
        const tokenData = result[0];
        const ahora = new Date(tokenData.ahora);
        const expira = new Date(tokenData.expira);
        
        if (expira > ahora) {
          console.log(`✅ Código válido encontrado (con TRIM)`);
          return {
            success: true,
            valid: true,
            message: "Código válido.",
            id_usuario: tokenData.id_usuario,
            token: tokenData.token
          };
        }
      }

      console.log(`❌ Código no encontrado o ya usado/expirado`);
      console.log(`🔍 Código buscado: "${codigoLimpio}"`);
      console.log(`🔍 Longitud del código: ${codigoLimpio.length}`);
      
      return {
        success: true,
        valid: false,
        message: "Código inválido o expirado. Verifica que hayas ingresado el código correcto."
      };
    } catch (error) {
      console.error("❌ Error validando código:", error);
      return {
        success: false,
        valid: false,
        message: `Error al validar código: ${error instanceof Error ? error.message : 'Error desconocido'}`
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
   * Restablecer contraseña con código
   */
  static async resetPasswordWithCode(
    email: string,
    codigo: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validar código
      const validation = await this.validateRecoveryCode(email, codigo);
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

      // Marcar código como usado
      await conexion.execute(
        `UPDATE tokens_recuperacion SET usado = 1 WHERE token = ? AND id_usuario = ?`,
        [codigo, validation.id_usuario]
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











