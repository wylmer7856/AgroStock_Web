// 🌐 SERVICIO BASE PARA TODAS LAS LLAMADAS A LA API

import { APP_CONFIG } from '../config';
import type { ApiResponse, LoginResponse, AppError } from '../types';

class ApiService {
  public baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = APP_CONFIG.API_BASE_URL;
    this.token = this.getStoredToken();
  }

  // ===== MÉTODOS PRIVADOS =====
  private getStoredToken(): string | null {
    return localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY);
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(
    response: Response, 
    endpoint: string = '', 
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    // Obtener el texto de la respuesta como ArrayBuffer para manejar UTF-8 correctamente
    // Esto asegura que los caracteres especiales se decodifiquen correctamente
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(arrayBuffer);
    
    // Si la respuesta no es JSON, manejar como texto
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${text || response.statusText}`);
      }
      // Intentar parsear como JSON si es posible
      try {
        return JSON.parse(text);
      } catch {
        return { success: true, data: text as any, message: 'Respuesta exitosa' };
      }
    }

    // Parsear JSON desde el texto decodificado correctamente con UTF-8
    const data = JSON.parse(text);

    // Manejar errores de autenticación
    if (response.status === 401) {
      // Rutas públicas (login, register) no deberían mostrar "sesión expirada"
      const isPublicRoute = endpoint.includes('/auth/login') || 
                           endpoint.includes('/auth/register') ||
                           endpoint.includes('/auth/forgot-password') ||
                           endpoint.includes('/auth/reset-password');
      
      // Si es una ruta pública, usar el mensaje del backend
      if (isPublicRoute) {
        const errorMessage = data.message || 
                            data.error || 
                            'Credenciales incorrectas. Verifica tu email y contraseña.';
        throw new Error(errorMessage);
      }
      
      // Para rutas protegidas, limpiar token y mostrar mensaje de sesión expirada
      this.clearToken();
      const errorMessage = data.message || 
                          data.error || 
                          'Sesión expirada. Por favor, inicia sesión nuevamente.';
      throw new Error(errorMessage);
    }

    if (response.status === 403) {
      const errorMessage = data.message || 
                          data.error || 
                          'No tienes permisos para realizar esta acción.';
      throw new Error(errorMessage);
    }

    // Normalizar respuesta: algunos endpoints devuelven {success, data} otros {success, categorias, usuarios, etc}
    if (data.success && !data.data && (data.categorias || data.usuarios || data.productos || data.reportes || data.acciones || data.pedidos || data.notificaciones || data.mensajes)) {
      // Convertir a formato estándar
      const key = data.categorias ? 'categorias' : 
                  data.usuarios ? 'usuarios' : 
                  data.productos ? 'productos' : 
                  data.reportes ? 'reportes' : 
                  data.acciones ? 'acciones' :
                  data.pedidos ? 'pedidos' :
                  data.notificaciones ? 'notificaciones' :
                  data.mensajes ? 'mensajes' : null;
      if (key) {
        data.data = data[key];
      }
    }

    if (!response.ok) {
      // Manejar diferentes formatos de error del backend
      const errorMessage = data.message || 
                          data.error || 
                          `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Si la respuesta es exitosa pero no tiene el formato esperado, adaptarla
    if (data.success === undefined && data.data !== undefined) {
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Operación exitosa'
      };
    }

    // Si la respuesta tiene success: false, lanzar error
    if (data.success === false) {
      const errorMsg = data.message || data.error || 'Error en la operación';
      throw new Error(errorMsg);
    }

    return data;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T> | any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 Making ${options.method || 'GET'} request to: ${url}`);
      const response = await fetch(url, config);
      console.log(`✅ Response status: ${response.status} for ${url}`);
      return await this.handleResponse<T>(response, endpoint, includeAuth);
    } catch (error: unknown) {
      console.error(`❌ API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      console.error(`   URL: ${url}`);
      console.error(`   Error type: ${error?.name || 'Unknown'}`);
      console.error(`   Error message: ${error?.message || 'No message'}`);
      
      // Proporcionar mensajes de error más descriptivos
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        throw new Error(`No se pudo conectar con el servidor. Verifica que el backend esté corriendo en ${this.baseURL}`);
      }
      
      throw error;
    }
  }

  // ===== MÉTODOS PÚBLICOS =====
  
  // GET request
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  // POST request
  async post<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // DELETE request
  async delete<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // ===== MÉTODOS DE AUTENTICACIÓN =====
  
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(APP_CONFIG.AUTH.TOKEN_KEY, token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem(APP_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(APP_CONFIG.AUTH.SESSION_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  // Construir query string para filtros
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Verificar si el token está próximo a expirar
  isTokenExpiring(): boolean {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const now = Date.now() / 1000;
      const expiry = payload.exp;
      
      return (expiry - now) < (APP_CONFIG.AUTH.TOKEN_EXPIRY_BUFFER / 1000);
    } catch {
      return true;
    }
  }

  // Obtener información del usuario desde el token
  getUserFromToken(): any {
    if (!this.token) return null;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }
}

// Instancia singleton del servicio
export const apiService = new ApiService();
export default apiService;



