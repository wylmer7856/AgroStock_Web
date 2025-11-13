// 🛒 SERVICIO DE CARRITO DE COMPRAS

import apiService from './api';
import type { 
  ApiResponse 
} from '../types';

export interface ItemCarrito {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  disponible: boolean;
  stock_actual: number;
  producto?: {
    nombre: string;
    imagen_principal?: string;
    stock: number;
    disponible: boolean;
  };
}

export interface Carrito {
  id_usuario: number;
  items: ItemCarrito[];
  total_precio: number;
  total_items: number;
  fecha_actualizacion: string;
}

export interface AgregarAlCarritoData {
  id_producto: number;
  cantidad: number;
}

class CarritoService {
  
  // ===== OBTENER CARRITO =====
  async obtenerCarrito(): Promise<ApiResponse<Carrito>> {
    try {
      const response = await apiService.get<Carrito>('/cart');
      return response;
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
      throw error;
    }
  }

  // ===== AGREGAR AL CARRITO =====
  async agregarAlCarrito(data: AgregarAlCarritoData): Promise<ApiResponse<ItemCarrito>> {
    try {
      const response = await apiService.post<ItemCarrito>('/cart/add', data);
      return response;
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR ITEM DEL CARRITO =====
  async actualizarItem(id: number, cantidad: number): Promise<ApiResponse<ItemCarrito>> {
    try {
      const response = await apiService.put<ItemCarrito>(
        `/cart/item/${id}`,
        { cantidad }
      );
      return response;
    } catch (error) {
      console.error('Error actualizando item del carrito:', error);
      throw error;
    }
  }

  // ===== ELIMINAR ITEM DEL CARRITO =====
  async eliminarItem(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(`/cart/item/${id}`);
      return response;
    } catch (error) {
      console.error('Error eliminando item del carrito:', error);
      throw error;
    }
  }

  // ===== LIMPIAR CARRITO =====
  async limpiarCarrito(): Promise<ApiResponse> {
    try {
      const response = await apiService.delete('/cart/clear');
      return response;
    } catch (error) {
      console.error('Error limpiando carrito:', error);
      throw error;
    }
  }

  // ===== VALIDAR CARRITO =====
  async validarCarrito(): Promise<ApiResponse<{ valido: boolean; errores: string[] }>> {
    try {
      const response = await apiService.get<{ valido: boolean; errores: string[] }>('/cart/validate');
      return response;
    } catch (error) {
      console.error('Error validando carrito:', error);
      throw error;
    }
  }

  // ===== PROCESAR CHECKOUT =====
  async checkout(datosEntrega: {
    direccionEntrega: string; // El backend espera este nombre
    id_ciudad_entrega?: number;
    notas?: string;
    metodo_pago: 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'pse' | 'tarjeta';
  }): Promise<ApiResponse<{ pedido_id: number; total_precio: number }>> {
    try {
      const response = await apiService.post<{ pedido_id: number; total_precio: number }>(
        '/cart/checkout',
        datosEntrega
      );
      return response;
    } catch (error) {
      console.error('Error procesando checkout:', error);
      throw error;
    }
  }

  // ===== OBTENER ESTADÍSTICAS DEL CARRITO =====
  async obtenerEstadisticas(): Promise<ApiResponse<{
    total_items: number;
    total: number;
    items_disponibles: number;
    items_agotados: number;
  }>> {
    try {
      const response = await apiService.get('/cart/stats');
      return response;
    } catch (error) {
      console.error('Error obteniendo estadísticas del carrito:', error);
      throw error;
    }
  }
}

export const carritoService = new CarritoService();
export default carritoService;


