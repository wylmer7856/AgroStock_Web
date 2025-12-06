// 🔐 CONTROLADOR DE RECUPERACIÓN DE CONTRASEÑA

import { Context } from "../Dependencies/dependencias.ts";
import { PasswordRecoveryService } from "../Services/PasswordRecoveryService.ts";

export class PasswordRecoveryController {
  
  /**
   * Solicitar recuperación de contraseña por email
   */
  static async solicitarRecuperacionEmail(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email } = body;

      if (!email) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Email requerido",
          message: "Debes proporcionar un email"
        };
        return;
      }

      const result = await PasswordRecoveryService.generateRecoveryToken(email, 'email');

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en solicitar recuperación:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al procesar solicitud de recuperación"
      };
    }
  }

  /**
   * Solicitar recuperación de contraseña por SMS
   */
  static async solicitarRecuperacionSMS(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email } = body;

      if (!email) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Email requerido",
          message: "Debes proporcionar un email"
        };
        return;
      }

      const result = await PasswordRecoveryService.generateRecoveryToken(email, 'sms');

      // En producción, no devolver el código SMS
      if (result.success && result.codigo_sms) {
        delete result.codigo_sms;
      }

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en solicitar recuperación SMS:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al procesar solicitud de recuperación"
      };
    }
  }

  /**
   * Validar token de recuperación
   */
  static async validarToken(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { token } = body;

      if (!token) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          valid: false,
          message: "Token requerido"
        };
        return;
      }

      const result = await PasswordRecoveryService.validateRecoveryToken(token);

      // Formatear respuesta para que el frontend la entienda correctamente
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = {
        success: result.success,
        data: {
          valid: result.valid,
          message: result.message,
          id_usuario: result.id_usuario
        },
        message: result.message
      };
    } catch (error) {
      console.error("Error validando token:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        valid: false,
        message: "Error al validar token"
      };
    }
  }

  /**
   * Validar código de recuperación por email
   */
  static async validarCodigo(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      let { email, codigo } = body;

      // Limpiar y normalizar los datos
      email = email ? email.toString().trim().toLowerCase() : '';
      codigo = codigo ? codigo.toString().trim().replace(/\s/g, '') : '';

      console.log(`🔍 Validación de código recibida:`);
      console.log(`   Email: ${email}`);
      console.log(`   Código: "${codigo}" (longitud: ${codigo.length})`);

      if (!email || !codigo) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          valid: false,
          message: "Email y código son requeridos"
        };
        return;
      }

      // Validar que el código tenga 6 dígitos
      if (!/^\d{6}$/.test(codigo)) {
        console.log(`❌ Código inválido: debe tener 6 dígitos numéricos`);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          valid: false,
          message: "El código debe tener 6 dígitos numéricos"
        };
        return;
      }

      const result = await PasswordRecoveryService.validateRecoveryCode(email, codigo);

      console.log(`📊 Resultado de validación: ${result.valid ? 'VÁLIDO' : 'INVÁLIDO'}`);

      // Formatear respuesta para que el frontend la entienda correctamente
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = {
        success: result.success,
        data: {
          valid: result.valid,
          message: result.message,
          id_usuario: result.id_usuario,
          token: result.token
        },
        message: result.message
      };
    } catch (error) {
      console.error("❌ Error validando código:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        valid: false,
        message: `Error al validar código: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Validar código SMS
   */
  static async validarCodigoSMS(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email, codigo } = body;

      if (!email || !codigo) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          valid: false,
          message: "Email y código son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.validateSMSCode(email, codigo);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error validando código SMS:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        valid: false,
        message: "Error al validar código"
      };
    }
  }

  /**
   * Restablecer contraseña con token
   */
  static async restablecerConToken(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { token, newPassword } = body;

      if (!token || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Token y nueva contraseña son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.resetPasswordWithToken(token, newPassword);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error al restablecer contraseña"
      };
    }
  }

  /**
   * Restablecer contraseña con código
   */
  static async restablecerConCodigo(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email, codigo, newPassword } = body;

      if (!email || !codigo || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Email, código y nueva contraseña son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.resetPasswordWithCode(email, codigo, newPassword);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error al restablecer contraseña"
      };
    }
  }

  /**
   * Restablecer contraseña con código SMS
   */
  static async restablecerConSMS(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { email, codigo, newPassword } = body;

      if (!email || !codigo || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Email, código y nueva contraseña son requeridos"
        };
        return;
      }

      const result = await PasswordRecoveryService.resetPasswordWithSMS(email, codigo, newPassword);

      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error restableciendo contraseña:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error al restablecer contraseña"
      };
    }
  }
}











