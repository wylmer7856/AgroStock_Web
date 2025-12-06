// 🔐 SERVICIO DE RECUPERACIÓN DE CONTRASEÑA

import apiService from './api';
import type { ApiResponse } from '../types';

interface RequestRecoveryResponse {
  success: boolean;
  message: string;
}

interface ValidateTokenResponse {
  success: boolean;
  valid: boolean;
  message: string;
  id_usuario?: number;
}

interface ValidateCodeResponse {
  success: boolean;
  valid: boolean;
  message: string;
  id_usuario?: number;
  token?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

class PasswordRecoveryService {
  
  // ===== SOLICITAR RECUPERACIÓN POR EMAIL =====
  async solicitarRecuperacionEmail(email: string): Promise<ApiResponse<RequestRecoveryResponse>> {
    try {
      const response = await apiService.post<RequestRecoveryResponse>(
        `/password-recovery/email`,
        { email },
        false // No requiere autenticación
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al solicitar recuperación de contraseña');
    }
  }

  // ===== VALIDAR TOKEN =====
  async validarToken(token: string): Promise<ApiResponse<ValidateTokenResponse>> {
    try {
      const response = await apiService.post<ValidateTokenResponse>(
        `/password-recovery/validate-token`,
        { token },
        false // No requiere autenticación
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al validar token');
    }
  }

  // ===== VALIDAR CÓDIGO =====
  async validarCodigo(email: string, codigo: string): Promise<ApiResponse<ValidateCodeResponse>> {
    try {
      const response = await apiService.post<ValidateCodeResponse>(
        `/password-recovery/validate-code`,
        { email, codigo },
        false // No requiere autenticación
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al validar código');
    }
  }

  // ===== RESTABLECER CONTRASEÑA CON TOKEN =====
  async restablecerContraseña(token: string, newPassword: string): Promise<ApiResponse<ResetPasswordResponse>> {
    try {
      const response = await apiService.post<ResetPasswordResponse>(
        `/password-recovery/reset`,
        { token, newPassword },
        false // No requiere autenticación
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al restablecer contraseña');
    }
  }

  // ===== RESTABLECER CONTRASEÑA CON CÓDIGO =====
  async restablecerContraseñaConCodigo(email: string, codigo: string, newPassword: string): Promise<ApiResponse<ResetPasswordResponse>> {
    try {
      const response = await apiService.post<ResetPasswordResponse>(
        `/password-recovery/reset-code`,
        { email, codigo, newPassword },
        false // No requiere autenticación
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Error al restablecer contraseña');
    }
  }
}

// Instancia singleton del servicio
export const passwordRecoveryService = new PasswordRecoveryService();
export default passwordRecoveryService;


