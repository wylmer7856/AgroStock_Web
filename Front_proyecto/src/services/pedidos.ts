// 📦 SERVICIO DE PEDIDOS

import apiService from './api';
import type { 
  ApiResponse 
} from '../types';

export interface Pedido {
  id_pedido: number;
  id_consumidor: number;
  id_productor: number;
  total: number;
  estado: 'pendiente' | 'confirmado' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado';
  direccion_entrega: string;
  id_ciudad_entrega?: number | null;
  metodo_pago: 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'pse' | 'tarjeta';
  estado_pago?: 'pendiente' | 'pagado' | 'reembolsado';
  notas?: string | null;
  fecha_pedido?: string | null;
  fecha_entrega?: string | null;
  // Información adicional del backend
  consumidor_nombre?: string;
  consumidor_email?: string;
  consumidor_telefono?: string;
  productor_nombre?: string;
  productor_email?: string;
  productor_telefono?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  producto_nombre?: string;
  producto_imagen?: string;
  producto_descripcion?: string;
  unidad_medida?: string;
  producto?: {
    nombre: string;
    imagen_principal?: string;
    descripcion?: string;
  };
}

export interface CrearPedidoData {
  id_consumidor: number;
  id_productor: number;
  productos: Array<{
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }>;
  direccion_entrega: string;
  id_ciudad_entrega?: number;
  notas?: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'pse' | 'tarjeta';
}

class PedidosService {
  
  // ===== LISTAR PEDIDOS =====
  async listarPedidos(filtros?: {
    id_consumidor?: number;
    id_productor?: number;
    estado?: string;
  }): Promise<ApiResponse<Pedido[]>> {
    try {
      const queryString = filtros ? apiService.buildQueryString(filtros) : '';
      const response = await apiService.get<Pedido[]>(
        `/pedidos${queryString}`
      );
      return response;
    } catch (error) {
      console.error('Error listando pedidos:', error);
      throw error;
    }
  }

  // ===== OBTENER PEDIDO POR ID =====
  async obtenerPedido(id: number): Promise<ApiResponse<Pedido & { detalles: DetallePedido[] }>> {
    try {
      const response = await apiService.get<Pedido & { detalles: DetallePedido[] }>(
        `/pedidos/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo pedido:', error);
      throw error;
    }
  }

  // ===== CREAR PEDIDO =====
  async crearPedido(pedidoData: CrearPedidoData): Promise<ApiResponse<Pedido>> {
    try {
      const response = await apiService.post<Pedido>(
        `/pedidos`,
        pedidoData
      );
      return response;
    } catch (error) {
      console.error('Error creando pedido:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR PEDIDO =====
  async actualizarPedido(id: number, datos: Partial<Pedido>): Promise<ApiResponse<Pedido>> {
    try {
      const response = await apiService.put<Pedido>(
        `/pedidos/${id}`,
        datos
      );
      return response;
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR ESTADO DEL PEDIDO =====
  async actualizarEstado(id: number, estado: Pedido['estado']): Promise<ApiResponse<Pedido>> {
    try {
      const response = await apiService.put<Pedido>(
        `/pedidos/${id}`,
        { estado }
      );
      return response;
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR ESTADO DE PAGO =====
  async actualizarEstadoPago(id: number, estadoPago: 'pendiente' | 'pagado' | 'reembolsado'): Promise<ApiResponse<Pedido>> {
    try {
      const response = await apiService.put<Pedido>(
        `/pedidos/${id}`,
        { estado_pago: estadoPago }
      );
      return response;
    } catch (error) {
      console.error('Error actualizando estado de pago:', error);
      throw error;
    }
  }

  // ===== ELIMINAR PEDIDO =====
  async eliminarPedido(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/pedidos/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      throw error;
    }
  }

  // ===== CANCELAR PEDIDO =====
  async cancelarPedido(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.put(
        `/pedidos/${id}/cancelar`,
        {}
      );
      return response;
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      throw error;
    }
  }

  // ===== OBTENER PEDIDOS DEL USUARIO ACTUAL =====
  async obtenerMisPedidos(tipo: 'consumidor' | 'productor', userId?: number): Promise<ApiResponse<Pedido[]>> {
    try {
      // Usar el endpoint específico que filtra por usuario autenticado
      const response = await apiService.get<Pedido[]>('/pedidos/mis-pedidos', true);
      
      return response;
    } catch (error) {
      console.error('Error obteniendo mis pedidos:', error);
      throw error;
    }
  }
}

export const pedidosService = new PedidosService();
export default pedidosService;


