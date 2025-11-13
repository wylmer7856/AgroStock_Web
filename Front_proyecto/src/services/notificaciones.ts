// 🔔 SERVICIO DE NOTIFICACIONES

import apiService from './api';
import type { Notification, ApiResponse } from '../types';

class NotificacionesService {
  
  // ===== OBTENER MIS NOTIFICACIONES =====
  async obtenerMisNotificaciones(limit: number = 50, soloNoLeidas: boolean = false): Promise<ApiResponse<Notification[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit.toString());
      if (soloNoLeidas) queryParams.append('soloNoLeidas', 'true');
      
      const queryString = queryParams.toString();
      const response = await apiService.get<Notification[]>(
        `/notificaciones${queryString ? `?${queryString}` : ''}`,
        true // Requiere autenticación
      );
      
      // El backend retorna { success: true, notificaciones: [...], total: number }
      // Necesitamos extraer las notificaciones de la respuesta
      const notificaciones = Array.isArray(response.data) 
        ? response.data 
        : (response as any).notificaciones || [];
      
      return {
        success: response.success,
        data: notificaciones,
        message: response.message || 'Notificaciones obtenidas correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // ===== CONTAR NOTIFICACIONES NO LEÍDAS =====
  async contarNoLeidas(): Promise<ApiResponse<number>> {
    try {
      const response = await apiService.get<{ totalNoLeidas: number }>(
        '/notificaciones/contar',
        true
      );
      
      // El backend retorna { success: true, totalNoLeidas: number }
      // Puede estar en response.data.totalNoLeidas o directamente en response.totalNoLeidas
      const total = (response.data as any)?.totalNoLeidas ?? 
                    (response as any).totalNoLeidas ?? 
                    0;
      
      return {
        success: response.success,
        data: total,
        message: response.message || 'Conteo obtenido correctamente'
      };
    } catch (error) {
      console.error('Error contando notificaciones no leídas:', error);
      throw error;
    }
  }

  // ===== MARCAR NOTIFICACIÓN COMO LEÍDA =====
  async marcarComoLeida(id_notificacion: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.put<void>(
        `/notificaciones/${id_notificacion}/leer`,
        {},
        true
      );
      
      return {
        success: response.success,
        message: response.message || 'Notificación marcada como leída'
      };
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  // ===== MARCAR TODAS COMO LEÍDAS =====
  async marcarTodasComoLeidas(): Promise<ApiResponse<{ actualizadas: number }>> {
    try {
      const response = await apiService.put<{ actualizadas: number }>(
        '/notificaciones/marcar-todas',
        {},
        true
      );
      
      return {
        success: response.success,
        data: (response.data as any) || { actualizadas: 0 },
        message: response.message || 'Notificaciones marcadas como leídas'
      };
    } catch (error) {
      console.error('Error marcando todas las notificaciones:', error);
      throw error;
    }
  }

  // ===== ELIMINAR NOTIFICACIÓN =====
  async eliminarNotificacion(id_notificacion: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.delete<void>(
        `/notificaciones/${id_notificacion}`,
        true
      );
      
      return {
        success: response.success,
        message: response.message || 'Notificación eliminada correctamente'
      };
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  }
}

export const notificacionesService = new NotificacionesService();
export default notificacionesService;






