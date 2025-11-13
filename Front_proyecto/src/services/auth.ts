// 🔐 SERVICIO DE AUTENTICACIÓN

import apiService from './api';
import { APP_CONFIG } from '../config';
import type { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse, 
  User, 
  ApiResponse 
} from '../types';

class AuthService {
  
  // ===== LOGIN =====
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiService.post<any>(
        `/auth/login`,
        credentials,
        false // No incluir token de autenticación para login
      );
      
      console.log('[AuthService] Respuesta completa del login:', response);
      
      // El backend puede devolver { success: true, token, usuario, ... } directamente
      // O puede venir envuelto en response.data
      let loginData: any = response;
      
      // Si viene envuelto en data, extraerlo
      if (response.success && response.data && (response.data.token || response.data.usuario)) {
        loginData = response.data;
      } else if (response.success && (response.token || response.usuario)) {
        // Ya está en el nivel correcto
        loginData = response;
      }
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Error en el login');
      }
      
      // Validar que tenga los datos necesarios
      if (!loginData.token) {
        console.error('[AuthService] No hay token en la respuesta:', loginData);
        throw new Error('No se recibió token del servidor');
      }
      
      // El backend real devuelve 'usuario'
      if (!loginData.usuario) {
        console.error('[AuthService] No hay usuario en la respuesta:', loginData);
        throw new Error('No se recibió información del usuario');
      }
      
      const usuarioBackend = loginData.usuario as { id_usuario?: number; id?: number; rol?: string; [key: string]: any };
      
      // Normalizar el rol: asegurar que sea uno de los valores válidos de la BD
      let rolNormalizado: 'admin' | 'consumidor' | 'productor' = 'consumidor';
      const rolBackend = (usuarioBackend.rol || '').toLowerCase().trim();
      if (rolBackend === 'admin' || rolBackend === 'consumidor' || rolBackend === 'productor') {
        rolNormalizado = rolBackend as 'admin' | 'consumidor' | 'productor';
      }
      
      console.log(`[AuthService] Rol recibido del backend: "${usuarioBackend.rol}", Rol normalizado: "${rolNormalizado}"`);
      
      // Normalizar el usuario: asegurar que tenga id_usuario y rol correcto
      const usuarioNormalizado: User = {
        id_usuario: usuarioBackend.id_usuario || usuarioBackend.id || 0,
        nombre: usuarioBackend.nombre || '',
        email: usuarioBackend.email || '',
        rol: rolNormalizado,
        telefono: usuarioBackend.telefono || null,
        direccion: usuarioBackend.direccion || null,
        id_ciudad: usuarioBackend.id_ciudad || null,
        activo: usuarioBackend.activo !== undefined ? usuarioBackend.activo : true,
        email_verificado: usuarioBackend.email_verificado || false,
        foto_perfil: usuarioBackend.foto_perfil || null,
        fecha_registro: usuarioBackend.fecha_registro || null,
        ultimo_acceso: usuarioBackend.ultimo_acceso || null,
        // Compatibilidad
        id: usuarioBackend.id_usuario || usuarioBackend.id || 0
      };
      
      // Guardar token y datos del usuario
      apiService.setToken(loginData.token);
      this.saveUserData(usuarioNormalizado);
      if (loginData.session_id) {
        this.saveSessionData(loginData.session_id);
      }
      
      console.log('[AuthService] Login exitoso, usuario normalizado:', usuarioNormalizado);
      
      // Retornar LoginResponse con usuario normalizado
      const loginResponse: LoginResponse = {
        success: true,
        message: response.message || loginData.message || 'Login exitoso',
        token: loginData.token,
        usuario: usuarioNormalizado,
        session_id: loginData.session_id || '',
        expires_in: loginData.expires_in || 86400
      };
      
      return loginResponse;
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    }
  }

  // ===== REGISTRO =====
  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.post<ApiResponse<User>>(
        `/auth/register`,
        userData,
        false // No incluir token de autenticación para registro
      );

      return response;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // ===== LOGOUT =====
  async logout(): Promise<void> {
    try {
      // Intentar hacer logout en el servidor
      await apiService.post(`/auth/logout`);
    } catch (error) {
      console.warn('Error en logout del servidor:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado del servidor
      this.clearUserData();
    }
  }

  // ===== VERIFICAR TOKEN =====
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiService.get(`/auth/verify`);
      return response.success;
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  }

  // ===== CAMBIAR CONTRASEÑA =====
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await apiService.post(
        `/auth/change-password`,
        { currentPassword, newPassword }
      );

      return response;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  // Obtener usuario actual
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(APP_CONFIG.AUTH.USER_KEY);
      if (!userData) {
        return null;
      }
      
      // Limpiar datos inválidos
      const cleanedData = userData.trim();
      if (!cleanedData || cleanedData === 'undefined' || cleanedData === 'null') {
        localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
        return null;
      }
      
      const parsed = JSON.parse(cleanedData);
      
      // Validar que tenga los campos mínimos
      if (!parsed || !parsed.rol) {
        localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
        return null;
      }
      
      // Normalizar id_usuario
      if (parsed.id_usuario === undefined && parsed.id !== undefined) {
        parsed.id_usuario = parsed.id;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      // Limpiar datos corruptos
      localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
      return null;
    }
  }

  // Guardar datos del usuario
  private saveUserData(user: User): void {
    // Normalizar el usuario antes de guardarlo
    const usuarioNormalizado = {
      ...user,
      id_usuario: user.id_usuario || user.id || 0,
      id: user.id_usuario || user.id || 0
    };
    console.log('Guardando usuario en localStorage:', usuarioNormalizado);
    localStorage.setItem(APP_CONFIG.AUTH.USER_KEY, JSON.stringify(usuarioNormalizado));
  }

  // Guardar datos de sesión
  private saveSessionData(sessionId: string): void {
    localStorage.setItem(APP_CONFIG.AUTH.SESSION_KEY, sessionId);
  }

  // Limpiar todos los datos de usuario
  private clearUserData(): void {
    apiService.clearToken();
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return apiService.isAuthenticated() && !!this.getCurrentUser();
  }

  // Obtener rol del usuario actual
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.rol || null;
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Verificar si el usuario es productor
  isProducer(): boolean {
    return this.hasRole('productor');
  }

  // Verificar si el usuario es consumidor
  isConsumer(): boolean {
    return this.hasRole('consumidor');
  }

  // Obtener ID del usuario actual
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id_usuario || user?.id || null;
  }

  // Verificar si el token está próximo a expirar
  isTokenExpiring(): boolean {
    return apiService.isTokenExpiring();
  }

  // Renovar token si es necesario
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isTokenExpiring()) {
      try {
        const isValid = await this.verifyToken();
        if (!isValid) {
          this.clearUserData();
          return false;
        }
        return true;
      } catch (error) {
        this.clearUserData();
        return false;
      }
    }
    return true;
  }
}

// Instancia singleton del servicio de autenticación
export const authService = new AuthService();
export default authService;
