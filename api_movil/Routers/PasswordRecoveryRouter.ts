// 🔐 ROUTER DE RECUPERACIÓN DE CONTRASEÑA

import { Router } from "../Dependencies/dependencias.ts";
import { PasswordRecoveryController } from "../Controller/PasswordRecoveryController.ts";

export const PasswordRecoveryRouter = new Router();

// Solicitar recuperación por email
PasswordRecoveryRouter.post("/password-recovery/email", PasswordRecoveryController.solicitarRecuperacionEmail);

// Solicitar recuperación por SMS
PasswordRecoveryRouter.post("/password-recovery/sms", PasswordRecoveryController.solicitarRecuperacionSMS);

// Validar token
PasswordRecoveryRouter.post("/password-recovery/validate-token", PasswordRecoveryController.validarToken);

// Validar código de recuperación
PasswordRecoveryRouter.post("/password-recovery/validate-code", PasswordRecoveryController.validarCodigo);

// Validar código SMS
PasswordRecoveryRouter.post("/password-recovery/validate-sms", PasswordRecoveryController.validarCodigoSMS);

// Restablecer con token
PasswordRecoveryRouter.post("/password-recovery/reset", PasswordRecoveryController.restablecerConToken);

// Restablecer con código
PasswordRecoveryRouter.post("/password-recovery/reset-code", PasswordRecoveryController.restablecerConCodigo);

// Restablecer con SMS
PasswordRecoveryRouter.post("/password-recovery/reset-sms", PasswordRecoveryController.restablecerConSMS);











