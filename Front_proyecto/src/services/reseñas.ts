// ⭐ SERVICIO DE RESEÑAS

import apiService from './api';
import type { 
  Resena,
  ApiResponse 
} from '../types';

export interface CrearResenaData {
  id_pedido: number;
  id_producto: number;
  id_consumidor: number;
  id_productor: number;
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
  async obtenerReseñasPorProducto(idProducto: number): Promise<ApiResponse<Resena[]>> {
    try {
      const response = await apiService.get<Resena[]>(
        `/resenas/producto/${idProducto}`,
        false // Puede ser público
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo reseñas del producto:', error);
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

