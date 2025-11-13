// 📊 SERVICIO DE HISTORIAL DE PRECIOS

import apiService from './api';
import type { HistorialPrecio, ApiResponse } from '../types';

class HistorialPreciosService {
  
  // ===== LISTAR HISTORIAL DE PRECIOS (PÚBLICO) =====
  async listarHistorialPrecios(limit: number = 100): Promise<ApiResponse<HistorialPrecio[]>> {
    try {
      const response = await apiService.get<HistorialPrecio[]>(
        `/historial-precios?limit=${limit}`,
        false // Público, no requiere autenticación
      );
      
      return {
        success: response.success,
        data: Array.isArray(response.data) ? response.data : (response as any).historial || [],
        message: response.message || 'Historial obtenido correctamente'
      };
    } catch (error) {
      console.error('Error listando historial de precios:', error);
      throw error;
    }
  }

  // ===== OBTENER HISTORIAL DE UN PRODUCTO (PÚBLICO) =====
  async obtenerHistorialPorProducto(id_producto: number): Promise<ApiResponse<HistorialPrecio[]>> {
    try {
      const response = await apiService.get<HistorialPrecio[]>(
        `/historial-precios/producto/${id_producto}`,
        false // Público
      );
      
      return {
        success: response.success,
        data: Array.isArray(response.data) ? response.data : (response as any).historial || [],
        message: response.message || 'Historial del producto obtenido correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo historial del producto:', error);
      throw error;
    }
  }

  // ===== OBTENER ÚLTIMO PRECIO DE UN PRODUCTO (PÚBLICO) =====
  async obtenerUltimoPrecio(id_producto: number): Promise<ApiResponse<HistorialPrecio>> {
    try {
      const response = await apiService.get<HistorialPrecio>(
        `/historial-precios/producto/${id_producto}/ultimo`,
        false // Público
      );
      
      return {
        success: response.success,
        data: response.data || (response as any).ultimoPrecio,
        message: response.message || 'Último precio obtenido correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo último precio:', error);
      throw error;
    }
  }
}

export const historialPreciosService = new HistorialPreciosService();
export default historialPreciosService;






