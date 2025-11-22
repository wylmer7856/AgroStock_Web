// 👤 SERVICIO DE USUARIOS

import apiService from './api';
import { APP_CONFIG } from '../config';
import type { User, ApiResponse } from '../types';

interface ActualizarPerfilData {
  nombre?: string;
  email?: string;
  telefono?: string | null;
  direccion?: string | null;
  id_ciudad?: number | null;
  foto_perfil?: string | null;
}

const usuariosService = {
  // Obtener mi perfil completo
  async obtenerMiPerfil(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get<User>('/usuarios/mi-perfil');
      return response;
    } catch (error: any) {
      console.error('Error obteniendo perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener perfil'
      };
    }
  },

  // Actualizar mi perfil
  async actualizarMiPerfil(datos: ActualizarPerfilData): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.put<User>(
        '/usuarios/mi-perfil',
        datos
      );
      
      // Si la actualización fue exitosa, actualizar el usuario en localStorage
      if (response.success && response.data) {
        const userData = localStorage.getItem(APP_CONFIG.AUTH.USER_KEY);
        if (userData) {
          const user = JSON.parse(userData);
          const updatedUser = { ...user, ...response.data };
          localStorage.setItem(APP_CONFIG.AUTH.USER_KEY, JSON.stringify(updatedUser));
        }
      }
      
      return response;
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al actualizar perfil'
      };
    }
  }
};

export default usuariosService;


