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
      console.log('[AdminService] Creando usuario con datos:', userData);
      
      // Validar que todos los campos requeridos estén presentes
      if (!userData.nombre || !userData.email || !userData.password || !userData.telefono || !userData.direccion || !userData.id_ciudad || !userData.rol) {
        throw new Error('Faltan campos requeridos para crear el usuario');
      }

      // ✅ Endpoint correcto del backend - AdminRouter
      const response = await apiService.post<UsuarioAdmin>(
        `/admin/usuarios/crear`,
        {
          nombre: userData.nombre,
          email: userData.email,
          password: userData.password,
          telefono: userData.telefono,
          direccion: userData.direccion,
          id_ciudad: userData.id_ciudad,
          rol: userData.rol
        }
      );
      
      console.log('[AdminService] Respuesta del servidor:', response);
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Error creando usuario');
      }
      
      return response;
    } catch (error: any) {
      console.error('[AdminService] Error creando usuario:', error);
      // Si el error ya es un Error con mensaje, relanzarlo
      if (error instanceof Error) {
        throw error;
      }
      // Si es un objeto de error del servidor, extraer el mensaje
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          error?.error || 
                          'Error desconocido al crear usuario';
      throw new Error(errorMessage);
    }
  }

  // Editar usuario
  async editarUsuario(id: number, userData: Partial<UsuarioAdmin>): Promise<ApiResponse> {
    try {
      console.log('[AdminService] Editando usuario:', id, userData);
      const response = await apiService.put(
        `/admin/usuario/${id}`,
        userData
      );
      console.log('[AdminService] Respuesta editar usuario:', response);
      return response;
    } catch (error: any) {
      console.error('[AdminService] Error editando usuario:', error);
      // Si el error ya es un Error con mensaje, relanzarlo
      if (error instanceof Error) {
        throw error;
      }
      // Si es un objeto de error del servidor, extraer el mensaje
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          error?.error || 
                          'Error desconocido al editar usuario';
      throw new Error(errorMessage);
    }
  }

  // Eliminar usuario
  async eliminarUsuario(id: number): Promise<ApiResponse & { detalles?: Record<string, number> }> {
    try {
      console.log('[AdminService] Eliminando usuario:', id);
      const response = await apiService.delete<{ detalles?: Record<string, number> }>(
        `/admin/usuario/${id}`
      );
      console.log('[AdminService] Respuesta eliminar usuario:', response);
      return response;
    } catch (error: any) {
      console.error('[AdminService] Error eliminando usuario:', error);
      // Si el error ya es un Error con mensaje, relanzarlo
      if (error instanceof Error) {
        throw error;
      }
      // Si es un objeto de error del servidor, extraer el mensaje
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          error?.error || 
                          'Error desconocido al eliminar usuario';
      throw new Error(errorMessage);
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
  async eliminarProductoInapropiado(id: number, motivo: string): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/admin/producto/${id}`,
        { motivo }
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
      const response = await apiService.get<any>('/admin/configuracion');
      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Configuración obtenida correctamente'
      };
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      throw error;
    }
  }

  // Actualizar configuración del sistema
  async updateSystemConfig(config: any): Promise<ApiResponse> {
    try {
      const response = await apiService.put<any>('/admin/configuracion', config);
      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Configuración actualizada correctamente'
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
      const response = await apiService.get<any>(
        `/admin/estadisticas${queryString}`
      );
      
      console.log('📊 Respuesta completa del backend:', response);
      
      // El backend puede devolver data o estadisticas
      const datos = response.data || response.estadisticas;
      
      // Adaptar respuesta según estructura del backend
      if (response.success && datos) {
        return {
          success: response.success,
          data: datos as EstadisticasGenerales,
          message: response.message,
        };
      }
      
      return {
        success: response.success,
        data: datos as EstadisticasGenerales,
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
        `/api/admin/export/${tipo}`,
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

  // ===== GESTIÓN DE PEDIDOS =====
  async getPedidos(estado?: string): Promise<ApiResponse<any[]>> {
    const queryString = estado ? `?estado=${estado}` : '';
    return apiService.get(`/admin/pedidos${queryString}`);
  }

  async cambiarEstadoPedido(id_pedido: number, estado: string): Promise<ApiResponse<any>> {
    return apiService.put(`/admin/pedido/${id_pedido}/estado`, { estado });
  }

  async eliminarPedido(id_pedido: number): Promise<ApiResponse<any>> {
    try {
      console.log('[AdminService] Eliminando pedido:', id_pedido);
      const response = await apiService.delete(`/admin/pedido/${id_pedido}`);
      console.log('[AdminService] Respuesta eliminar pedido:', response);
      return response;
    } catch (error: any) {
      console.error('[AdminService] Error eliminando pedido:', error);
      if (error instanceof Error) {
        throw error;
      }
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          error?.error || 
                          'Error desconocido al eliminar pedido';
      throw new Error(errorMessage);
    }
  }

  // ===== GESTIÓN DE CATEGORÍAS =====
  async getCategorias(): Promise<ApiResponse<any[]>> {
    return apiService.get('/admin/categorias');
  }

  async crearCategoria(data: any): Promise<ApiResponse<any>> {
    return apiService.post('/admin/categorias', data);
  }

  async actualizarCategoria(id_categoria: number, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/admin/categoria/${id_categoria}`, data);
  }

  async editarCategoria(id_categoria: number, data: any): Promise<ApiResponse<any>> {
    return this.actualizarCategoria(id_categoria, data);
  }

  async eliminarCategoria(id_categoria: number): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/categoria/${id_categoria}`);
  }

  // ===== GESTIÓN DE MENSAJES =====
  async getMensajes(): Promise<ApiResponse<any[]>> {
    return apiService.get('/admin/mensajes');
  }

  async eliminarMensaje(id_mensaje: number): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/mensaje/${id_mensaje}`);
  }

  // ===== GESTIÓN DE RESEÑAS =====
  async getResenas(): Promise<ApiResponse<any[]>> {
    return apiService.get('/admin/resenas');
  }

  async eliminarResena(id_resena: number): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/resena/${id_resena}`);
  }

  // ===== GESTIÓN DE NOTIFICACIONES =====
  async getNotificaciones(tipo?: string): Promise<ApiResponse<any[]>> {
    const queryString = tipo ? `?tipo=${tipo}` : '';
    return apiService.get(`/admin/notificaciones${queryString}`);
  }

  async crearNotificacion(data: any): Promise<ApiResponse<any>> {
    return apiService.post('/admin/notificaciones', data);
  }

  async crearNotificacionMasiva(data: { titulo: string; mensaje: string; tipo: string }): Promise<ApiResponse<any>> {
    return apiService.post('/admin/notificaciones/masiva', data);
  }

  async editarNotificacion(id_notificacion: number, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/admin/notificacion/${id_notificacion}`, data);
  }

  async eliminarNotificacion(id_notificacion: number): Promise<ApiResponse<any>> {
    return apiService.delete(`/admin/notificacion/${id_notificacion}`);
  }

  // ===== GESTIÓN DE UBICACIONES =====
  async getRegiones(): Promise<ApiResponse<any[]>> {
    return apiService.get('/admin/regiones');
  }

  async getDepartamentos(id_region?: number): Promise<ApiResponse<any[]>> {
    const queryString = id_region ? `?id_region=${id_region}` : '';
    return apiService.get(`/admin/departamentos${queryString}`);
  }

  async getCiudades(id_departamento?: number): Promise<ApiResponse<any[]>> {
    const queryString = id_departamento ? `?id_departamento=${id_departamento}` : '';
    return apiService.get(`/admin/ciudades${queryString}`);
  }

  // ===== HISTORIAL DE PRECIOS =====
  async getHistorialPrecios(id_producto?: number): Promise<ApiResponse<any[]>> {
    const queryString = id_producto ? `?id_producto=${id_producto}` : '';
    return apiService.get(`/admin/historial-precios${queryString}`);
  }

  // ===== CARRITOS Y LISTAS =====
  async getCarritos(): Promise<ApiResponse<any[]>> {
    return apiService.get('/admin/carritos');
  }

  async getListasDeseos(): Promise<ApiResponse<any[]>> {
    return apiService.get('/admin/listas-deseos');
  }
}

// Instancia singleton del servicio de administración
export const adminService = new AdminService();
export default adminService;
