// 📂 SERVICIO DE CATEGORÍAS

import apiService from './api';
import type { 
  Categoria,
  ApiResponse 
} from '../types';

class CategoriasService {
  
  // ===== LISTAR CATEGORÍAS (PÚBLICO - SIN AUTENTICACIÓN) =====
  async listarCategorias(): Promise<ApiResponse<Categoria[]>> {
    try {
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<Categoria[]>(
        `/categorias`,
        false // No incluir token de autenticación
      );
      
      // Normalizar respuesta del backend
      let categoriasData: Categoria[] = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          categoriasData = response.data;
        } else if ((response as any).categorias && Array.isArray((response as any).categorias)) {
          categoriasData = (response as any).categorias;
        }
      }
      
      return {
        success: response.success,
        data: categoriasData,
        message: response.message || `${categoriasData.length} categorías encontradas`
      };
    } catch (error) {
      console.error('Error listando categorías:', error);
      throw error;
    }
  }

  // ===== OBTENER CATEGORÍA POR ID (PÚBLICO - SIN AUTENTICACIÓN) =====
  async obtenerCategoria(id: number): Promise<ApiResponse<Categoria>> {
    try {
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<Categoria>(
        `/categorias/${id}`,
        false // No incluir token de autenticación
      );
      
      // Normalizar respuesta
      if (response.success && (response as any).categoria) {
        return {
          success: true,
          data: (response as any).categoria,
          message: response.message || 'Categoría encontrada'
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      throw error;
    }
  }

  // ===== CREAR CATEGORÍA (ADMIN) =====
  async crearCategoria(categoriaData: {
    nombre: string;
    descripcion?: string;
    activa?: boolean;
  }): Promise<ApiResponse<Categoria>> {
    try {
      const response = await apiService.post<Categoria>(
        `/categorias`,
        categoriaData
      );
      return response;
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR CATEGORÍA (ADMIN) =====
  async actualizarCategoria(id: number, categoriaData: {
    nombre?: string;
    descripcion?: string;
    activa?: boolean;
  }): Promise<ApiResponse<Categoria>> {
    try {
      const response = await apiService.put<Categoria>(
        `/categorias/${id}`,
        categoriaData
      );
      return response;
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      throw error;
    }
  }

  // ===== ELIMINAR CATEGORÍA (ADMIN) =====
  async eliminarCategoria(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/categorias/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      throw error;
    }
  }

  // ===== OBTENER PRODUCTOS POR CATEGORÍA (PÚBLICO - SIN AUTENTICACIÓN) =====
  async obtenerProductosPorCategoria(id_categoria: number): Promise<ApiResponse<any[]>> {
    try {
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<any[]>(
        `/categorias/${id_categoria}/productos`,
        false // No incluir token de autenticación
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo productos por categoría:', error);
      throw error;
    }
  }
}

export const categoriasService = new CategoriasService();
export default categoriasService;
