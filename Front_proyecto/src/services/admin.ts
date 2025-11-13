// SERVICIO ESPECÍFICO PARA ADMINISTRACIÓN

import apiService from './api';
import { APP_CONFIG } from '../config';
import type { 
  UsuarioAdmin, 
  EstadisticasGenerales, 
  ActividadReciente,
  ProductoDetallado,
  Reporte,
  FiltrosUsuarios,
  FiltrosProductos,
  ApiResponse 
} from '../types';

class AdminService {
  
  // ===== GESTIÓN DE USUARIOS =====
  
  // Obtener todos los usuarios con filtros
  async getUsuarios(filtros?: FiltrosUsuarios): Promise<ApiResponse<UsuarioAdmin[]>> {
    try {
      const queryString = filtros ? apiService.buildQueryString(filtros) : '';
      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.get<{usuarios: UsuarioAdmin[], total: number} | UsuarioAdmin[]>(
        `/admin/usuarios${queryString}`
      );
      
      // Adaptar la respuesta según la estructura del backend
      if (response.success && Array.isArray(response.data)) {
        // Si la respuesta viene como array directo
        return {
          success: response.success,
          data: response.data as UsuarioAdmin[],
          message: response.message,
        };
      } else if (response.data && 'usuarios' in response.data) {
        // Si viene con estructura {usuarios, total}
        return {
          success: response.success,
          data: (response.data as any).usuarios || [],
          message: response.message,
          pagination: {
            total: (response.data as any).total || 0,
            pagina: 1,
            limite: 20,
            totalPaginas: Math.ceil(((response.data as any).total || 0) / 20),
            hayMasPaginas: false
          }
        };
      }
      
      return {
        success: response.success,
        data: [],
        message: response.message,
      };
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Crear usuario manualmente
  async crearUsuario(userData: Partial<UsuarioAdmin>): Promise<ApiResponse<UsuarioAdmin>> {
    try {
      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.post<UsuarioAdmin>(
        `/admin/usuarios/crear`,
        userData
      );
      return response;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  // Editar usuario
  async editarUsuario(id: number, userData: Partial<UsuarioAdmin>): Promise<ApiResponse> {
    try {
      const response = await apiService.put(
        `/admin/usuario/${id}`,
        userData
      );
      return response;
    } catch (error) {
      console.error('Error editando usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario
  async eliminarUsuario(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/admin/usuario/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE PRODUCTOS =====
  
  // Obtener todos los productos para admin
  async getProductos(filtros?: FiltrosProductos): Promise<ApiResponse<ProductoDetallado[]>> {
    try {
      const queryString = filtros ? apiService.buildQueryString(filtros) : '';
      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.get<{productos: ProductoDetallado[], total: number} | ProductoDetallado[]>(
        `/admin/productos${queryString}`
      );
      
      // Adaptar respuesta según estructura del backend
      if (response.success && Array.isArray(response.data)) {
        return {
          success: response.success,
          data: response.data,
          message: response.message,
        };
      } else if (response.data && 'productos' in response.data) {
        return {
          success: response.success,
          data: (response.data as any).productos || [],
          message: response.message,
        };
      }
      
      return {
        success: response.success,
        data: [],
        message: response.message,
      };
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  // Eliminar producto inapropiado
  async eliminarProductoInapropiado(id: number, _motivo: string): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/admin/producto/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE REPORTES =====
  
  // Obtener todos los reportes (basado en estructura real de BD)
  async getReportes(filtros?: any): Promise<ApiResponse<Reporte[]>> {
    try {
      const queryString = filtros ? apiService.buildQueryString(filtros) : '';
      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.get<any>(
        `/admin/reportes${queryString}`
      );
      
      // El backend devuelve {success: true, data: [...], reportes: [...]}
      let reportesData: Reporte[] = [];
      
      if (response.success) {
        if (Array.isArray(response.data)) {
          reportesData = response.data;
        } else if ((response as any).reportes && Array.isArray((response as any).reportes)) {
          reportesData = (response as any).reportes;
        } else if (response.data && Array.isArray(response.data)) {
          reportesData = response.data;
        }
        
        // Normalizar campos para el frontend
        reportesData = reportesData.map((r: any) => ({
          ...r,
          elemento_reportado: r.nombre_producto_reportado || r.nombre_usuario_reportado || 'N/A',
          tipo_elemento_display: r.tipo_elemento === 'producto' ? 'Producto' : 'Usuario',
          fecha_reporte: typeof r.fecha_reporte === 'string' ? r.fecha_reporte : new Date(r.fecha_reporte).toISOString(),
          fecha_resolucion: r.fecha_resolucion ? (typeof r.fecha_resolucion === 'string' ? r.fecha_resolucion : new Date(r.fecha_resolucion).toISOString()) : undefined
        }));
      }
      
      return {
        success: response.success,
        data: reportesData,
        message: response.message || `${reportesData.length} reportes encontrados`,
      };
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      throw error;
    }
  }

  // Resolver reporte
  async resolverReporte(id: number, accionTomada: string, estado: string = 'resuelto'): Promise<ApiResponse> {
    try {
      // ✅ Endpoint y parámetros correctos del backend
      const response = await apiService.put(
        `/admin/reporte/${id}`,
        { estado, accion_tomada: accionTomada }
      );
      return response;
    } catch (error) {
      console.error('Error resolviendo reporte:', error);
      throw error;
    }
  }

  // Eliminar reporte resuelto
  async eliminarReporteResuelto(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/admin/reporte/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE PEDIDOS =====
  
  // Obtener todos los pedidos
  async getPedidos(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiService.get<any[]>(
        `/pedidos`
      );
      
      // Normalizar respuesta
      let pedidosData: any[] = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          pedidosData = response.data;
        } else if ((response as any).pedidos && Array.isArray((response as any).pedidos)) {
          pedidosData = (response as any).pedidos;
        }
      }
      
      return {
        success: response.success,
        data: pedidosData,
        message: response.message || `${pedidosData.length} pedidos encontrados`
      };
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      throw error;
    }
  }

  // Actualizar estado de pedido
  async actualizarEstadoPedido(id: number, estado: string): Promise<ApiResponse> {
    try {
      const response = await apiService.put(
        `/pedidos/${id}`,
        { estado }
      );
      return response;
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      throw error;
    }
  }

  // ===== GESTIÓN DE CATEGORÍAS =====
  
  // Obtener todas las categorías (admin)
  async getCategorias(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiService.get<any[]>(
        `/categorias/admin/todas`
      );
      
      // Normalizar respuesta
      let categoriasData: any[] = [];
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
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  // Crear categoría
  async crearCategoria(categoriaData: { nombre: string; descripcion?: string; activa?: boolean }): Promise<ApiResponse> {
    try {
      const response = await apiService.post(
        `/categorias/admin/crear`,
        categoriaData
      );
      return response;
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  }

  // Editar categoría
  async editarCategoria(id: number, categoriaData: { nombre?: string; descripcion?: string; activa?: boolean }): Promise<ApiResponse> {
    try {
      const response = await apiService.put(
        `/categorias/${id}`,
        categoriaData
      );
      return response;
    } catch (error) {
      console.error('Error editando categoría:', error);
      throw error;
    }
  }

  // Eliminar categoría
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

  // ===== GESTIÓN DE AUDITORÍA =====
  
  // Obtener logs de auditoría
  async getAuditoriaLogs(filtros?: { tabla?: string; accion?: string; limite?: number }): Promise<ApiResponse<any[]>> {
    try {
      const queryString = filtros ? apiService.buildQueryString(filtros) : '';
      const response = await apiService.get<any[]>(
        `/auditoria/acciones${queryString}`
      );
      
      // Normalizar respuesta
      let logsData: any[] = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          logsData = response.data;
        } else if ((response as any).acciones && Array.isArray((response as any).acciones)) {
          logsData = (response as any).acciones;
        } else if ((response as any).logs && Array.isArray((response as any).logs)) {
          logsData = (response as any).logs;
        }
      }
      
      return {
        success: response.success,
        data: logsData,
        message: response.message || `${logsData.length} registros de auditoría encontrados`
      };
    } catch (error) {
      console.error('Error obteniendo logs de auditoría:', error);
      throw error;
    }
  }

  // ===== CONFIGURACIÓN DEL SISTEMA =====
  
  // Obtener configuración del sistema
  async getSystemConfig(): Promise<ApiResponse<any>> {
    try {
      // Por ahora retornamos configuración por defecto
      // En el futuro esto puede venir de una tabla de configuración
      return {
        success: true,
        data: {
          nombre_sistema: 'AgroStock',
          version: '1.0.0',
          mantenimiento: false,
          limite_usuarios: 1000,
          limite_productos: 10000,
          dias_expiracion_reportes: 30
        },
        message: 'Configuración obtenida correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      throw error;
    }
  }

  // Actualizar configuración del sistema
  async updateSystemConfig(config: any): Promise<ApiResponse> {
    try {
      // Por ahora solo retornamos éxito
      // En el futuro esto puede guardarse en una tabla de configuración
      return {
        success: true,
        data: config,
        message: 'Configuración actualizada correctamente'
      };
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      throw error;
    }
  }

  // ===== ESTADÍSTICAS Y MÉTRICAS =====
  
  // Obtener estadísticas generales
  async getEstadisticasGenerales(periodo?: string): Promise<ApiResponse<EstadisticasGenerales>> {
    try {
      const queryString = periodo ? `?periodo=${periodo}` : '';
      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.get<EstadisticasGenerales>(
        `/admin/estadisticas${queryString}`
      );
      
      // Adaptar respuesta según estructura del backend
      if (response.success && response.data) {
        return {
          success: response.success,
          data: response.data as EstadisticasGenerales,
          message: response.message,
        };
      }
      
      return {
        success: response.success,
        data: response.data as EstadisticasGenerales,
        message: response.message,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Obtener actividad reciente
  async getActividadReciente(): Promise<ApiResponse<ActividadReciente[]>> {
    try {
      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.get<{actividad: ActividadReciente[]} | ActividadReciente[]>(
        `/admin/actividad-reciente`
      );
      
      // Adaptar respuesta
      if (response.success && Array.isArray(response.data)) {
        return {
          success: response.success,
          data: response.data,
          message: response.message,
        };
      } else if (response.data && 'actividad' in response.data) {
        return {
          success: response.success,
          data: (response.data as any).actividad || [],
          message: response.message,
        };
      }
      
      return {
        success: response.success,
        data: [],
        message: response.message,
      };
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      throw error;
    }
  }

  // ===== ACCESO A PANELES =====
  
  // Acceder a panel de productor
  async accederPanelProductor(idUsuario: number): Promise<ApiResponse> {
    try {
      const response = await apiService.get(
        `/admin/usuario/${idUsuario}/productor`
      );
      return response;
    } catch (error) {
      console.error('Error accediendo a panel de productor:', error);
      throw error;
    }
  }

  // Acceder a panel de consumidor
  async accederPanelConsumidor(idUsuario: number): Promise<ApiResponse> {
    try {
      const response = await apiService.get(
        `/admin/usuario/${idUsuario}/consumidor`
      );
      return response;
    } catch (error) {
      console.error('Error accediendo a panel de consumidor:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====
  
  // Obtener métricas del dashboard
  async getDashboardMetrics(): Promise<{
    usuarios: ApiResponse<UsuarioAdmin[]>;
    productos: ApiResponse<ProductoDetallado[]>;
    reportes: ApiResponse<Reporte[]>;
    estadisticas: ApiResponse<EstadisticasGenerales>;
    actividad: ApiResponse<ActividadReciente[]>;
  }> {
    try {
      const [usuarios, productos, reportes, estadisticas, actividad] = await Promise.all([
        this.getUsuarios(),
        this.getProductos(),
        this.getReportes(),
        this.getEstadisticasGenerales(),
        this.getActividadReciente()
      ]);

      return {
        usuarios,
        productos,
        reportes,
        estadisticas,
        actividad
      };
    } catch (error) {
      console.error('Error obteniendo métricas del dashboard:', error);
      throw error;
    }
  }

  // Exportar datos (para futuras implementaciones)
  async exportarDatos(tipo: 'usuarios' | 'productos' | 'reportes'): Promise<Blob> {
    try {
      const response = await fetch(
        `${APP_CONFIG.API_BASE_URL}/admin/export/${tipo}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(apiService.isAuthenticated() && {
              'Authorization': `Bearer ${localStorage.getItem(APP_CONFIG.AUTH.TOKEN_KEY)}`
            })
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error exportando datos');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exportando datos:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de administración
export const adminService = new AdminService();
export default adminService;
