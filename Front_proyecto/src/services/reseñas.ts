// ⭐ SERVICIO DE RESEÑAS

import apiService from './api';
import type { 
  Resena,
  ApiResponse 
} from '../types';

export interface CrearResenaData {
  id_pedido?: number | null; // Opcional - cualquier usuario puede reseñar
  id_producto: number;
  id_consumidor?: number; // Se obtiene del usuario autenticado
  id_productor?: number; // Se obtiene del producto si no se proporciona
  calificacion: number; // 1-5
  comentario?: string | null;
}

export interface ActualizarResenaData {
  calificacion?: number; // 1-5
  comentario?: string | null;
}

class ReseñasService {
  
  // ===== LISTAR RESEÑAS =====
  async listarReseñas(): Promise<ApiResponse<Resena[]>> {
    try {
      const response = await apiService.get<Resena[]>(
        `/resenas`
      );
      return response;
    } catch (error) {
      console.error('Error listando reseñas:', error);
      throw error;
    }
  }

  // ===== OBTENER RESEÑAS POR PRODUCTO =====
  // PÚBLICO: Cualquiera puede ver las reseñas sin autenticación
  async obtenerReseñasPorProducto(idProducto: number): Promise<ApiResponse<{ data: Resena[]; promedio: number; total: number }>> {
    try {
      const response = await apiService.get<any>(
        `/resenas/producto/${idProducto}`,
        false // Público - no requiere autenticación
      );
      
      // El backend devuelve: { success: true, data: [...], promedio: X, total: Y }
      // El apiService devuelve: { success: true, data: [...], promedio: X, total: Y }
      let reseñasArray: Resena[] = [];
      let promedio = 0;
      let total = 0;
      
      if (response && response.success !== false) {
        // El apiService devuelve la respuesta tal cual del backend
        // Backend: { success: true, data: [...], promedio: X, total: Y }
        if (Array.isArray(response.data)) {
          reseñasArray = response.data;
        }
        
        // Promedio y total están en el nivel raíz de la respuesta
        promedio = typeof response.promedio === 'number' ? response.promedio : 0;
        total = typeof response.total === 'number' ? response.total : 0;
      }
      
      return {
        success: response?.success !== false,
        data: {
          data: reseñasArray,
          promedio,
          total
        },
        message: response?.message || 'Reseñas obtenidas correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo reseñas del producto:', error);
      // En caso de error, devolver estructura vacía pero válida
      return {
        success: false,
        data: {
          data: [],
          promedio: 0,
          total: 0
        },
        message: 'Error al obtener reseñas'
      };
    }
  }

  // ===== OBTENER PROMEDIO DE CALIFICACIONES =====
  // PÚBLICO: Cualquiera puede ver el promedio sin autenticación
  async obtenerPromedioCalificacion(idProducto: number): Promise<ApiResponse<{ promedio: number; total: number }>> {
    try {
      const response = await apiService.get<{ promedio: number; total: number }>(
        `/resenas/producto/${idProducto}/promedio`,
        false // Público - no requiere autenticación
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo promedio de calificaciones:', error);
      throw error;
    }
  }

  // ===== CREAR RESEÑA =====
  async crearReseña(reseñaData: CrearResenaData): Promise<ApiResponse<Resena>> {
    try {
      const response = await apiService.post<Resena>(
        `/resenas`,
        reseñaData
      );
      return response;
    } catch (error) {
      console.error('Error creando reseña:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR RESEÑA =====
  async actualizarReseña(idReseña: number, reseñaData: ActualizarResenaData): Promise<ApiResponse<Resena>> {
    try {
      const response = await apiService.put<Resena>(
        `/resenas/${idReseña}`,
        reseñaData
      );
      return response;
    } catch (error) {
      console.error('Error actualizando reseña:', error);
      throw error;
    }
  }

  // ===== ELIMINAR RESEÑA =====
  async eliminarReseña(idReseña: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/resenas/${idReseña}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando reseña:', error);
      throw error;
    }
  }
}

export const reseñasService = new ReseñasService();
export default reseñasService;

