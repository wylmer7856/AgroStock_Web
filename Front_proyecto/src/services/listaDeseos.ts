// ❤️ SERVICIO DE LISTA DE DESEOS

import apiService from './api';
import type { ListaDeseo, ApiResponse } from '../types';

class ListaDeseosService {
  
  // ===== OBTENER MI LISTA DE DESEOS =====
  async obtenerMiListaDeseos(): Promise<ApiResponse<ListaDeseo[]>> {
    try {
      const response = await apiService.get<ListaDeseo[]>(
        '/lista-deseos',
        true // Requiere autenticación
      );
      
      return {
        success: response.success,
        data: Array.isArray(response.data) ? response.data : (response as any).listaDeseos || [],
        message: response.message || 'Lista de deseos obtenida correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo lista de deseos:', error);
      throw error;
    }
  }

  // ===== AGREGAR PRODUCTO A LISTA DE DESEOS =====
  async agregarAListaDeseos(id_producto: number): Promise<ApiResponse<ListaDeseo>> {
    try {
      const response = await apiService.post<ListaDeseo>(
        '/lista-deseos',
        { id_producto },
        true
      );
      
      return {
        success: response.success,
        data: response.data || (response as any).listaDeseo,
        message: response.message || 'Producto agregado a la lista de deseos'
      };
    } catch (error) {
      console.error('Error agregando a lista de deseos:', error);
      throw error;
    }
  }

  // ===== ELIMINAR DE LISTA DE DESEOS (POR ID DE LISTA) =====
  async eliminarDeListaDeseos(id_lista: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.delete<void>(
        `/lista-deseos/${id_lista}`,
        true
      );
      
      return {
        success: response.success,
        message: response.message || 'Producto eliminado de la lista de deseos'
      };
    } catch (error) {
      console.error('Error eliminando de lista de deseos:', error);
      throw error;
    }
  }

  // ===== ELIMINAR PRODUCTO DE LISTA DE DESEOS (POR ID DE PRODUCTO) =====
  async eliminarProductoDeListaDeseos(id_producto: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiService.delete<void>(
        `/lista-deseos/producto/${id_producto}`,
        true
      );
      
      return {
        success: response.success,
        message: response.message || 'Producto eliminado de la lista de deseos'
      };
    } catch (error) {
      console.error('Error eliminando producto de lista de deseos:', error);
      throw error;
    }
  }

  // ===== LIMPIAR LISTA DE DESEOS =====
  async limpiarListaDeseos(): Promise<ApiResponse<{ eliminados: number }>> {
    try {
      const response = await apiService.delete<{ eliminados: number }>(
        '/lista-deseos/limpiar',
        true
      );
      
      return {
        success: response.success,
        data: (response.data as any) || { eliminados: 0 },
        message: response.message || 'Lista de deseos limpiada correctamente'
      };
    } catch (error) {
      console.error('Error limpiando lista de deseos:', error);
      throw error;
    }
  }

  // ===== VERIFICAR SI PRODUCTO ESTÁ EN LISTA DE DESEOS =====
  async verificarProductoEnLista(id_producto: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await apiService.get<{ estaEnLista: boolean }>(
        `/lista-deseos/producto/${id_producto}/verificar`,
        true
      );
      
      return {
        success: response.success,
        data: (response.data as any)?.estaEnLista || false,
        message: response.message || 'Verificación completada'
      };
    } catch (error) {
      console.error('Error verificando producto en lista:', error);
      throw error;
    }
  }
}

export const listaDeseosService = new ListaDeseosService();
export default listaDeseosService;






