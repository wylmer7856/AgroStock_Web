// 🛍️ SERVICIO DE PRODUCTOS

import apiService from './api';
import type { 
  Producto, 
  ProductoDetallado,
  FiltrosProductos,
  ApiResponse 
} from '../types';

class ProductosService {
  
  // ===== LISTAR PRODUCTOS (PÚBLICO - SIN AUTENTICACIÓN) =====
  async listarProductos(filtros?: FiltrosProductos): Promise<ApiResponse<Producto[]>> {
    try {
      const queryString = filtros ? apiService.buildQueryString(filtros) : '';
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<Producto[]>(
        `/productos${queryString}`,
        false // No incluir token de autenticación
      );
      
      // El backend puede devolver {success, data} o {success, productos}
      let productosData: Producto[] = [];
      
      if (response.success) {
        if (Array.isArray(response.data)) {
          productosData = response.data;
        } else if ((response as any).productos && Array.isArray((response as any).productos)) {
          productosData = (response as any).productos;
        }
      }
      
      return {
        success: response.success,
        data: productosData,
        message: response.message || `${productosData.length} productos encontrados`,
        pagination: response.pagination
      };
    } catch (error) {
      console.error('Error listando productos:', error);
      throw error;
    }
  }

  // ===== OBTENER PRODUCTO POR ID (PÚBLICO - SIN AUTENTICACIÓN) =====
  async obtenerProducto(id: number): Promise<ApiResponse<ProductoDetallado>> {
    try {
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<ProductoDetallado>(
        `/productos/${id}`,
        false // No incluir token de autenticación
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      throw error;
    }
  }

  // ===== CREAR PRODUCTO =====
  async crearProducto(productoData: Partial<Producto>): Promise<ApiResponse<Producto>> {
    try {
      const response = await apiService.post<Producto>(
        `/productos`,
        productoData
      );
      return response;
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  }

  // ===== ACTUALIZAR PRODUCTO =====
  async actualizarProducto(id: number, productoData: Partial<Producto>): Promise<ApiResponse<Producto>> {
    try {
      const response = await apiService.put<Producto>(
        `/productos/${id}`,
        productoData
      );
      return response;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  }

  // ===== ELIMINAR PRODUCTO =====
  async eliminarProducto(id: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/productos/${id}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }

  // ===== BUSCAR PRODUCTOS (PÚBLICO - SIN AUTENTICACIÓN) =====
  async buscarProductos(termino: string, filtros?: FiltrosProductos): Promise<ApiResponse<Producto[]>> {
    try {
      const queryParams = { ...filtros, nombre: termino };
      const queryString = apiService.buildQueryString(queryParams);
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<Producto[]>(
        `/productos/buscar${queryString}`,
        false // No incluir token de autenticación
      );
      
      // Normalizar respuesta
      let productosData: Producto[] = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          productosData = response.data;
        } else if ((response as any).productos && Array.isArray((response as any).productos)) {
          productosData = (response as any).productos;
        }
      }
      
      return {
        success: response.success,
        data: productosData,
        message: response.message || `${productosData.length} productos encontrados`
      };
    } catch (error) {
      console.error('Error buscando productos:', error);
      throw error;
    }
  }

  // ===== OBTENER PRODUCTOS POR USUARIO/PRODUCTOR =====
  async obtenerProductosPorUsuario(idUsuario: number): Promise<ApiResponse<Producto[]>> {
    try {
      const response = await apiService.get<Producto[]>(
        `/productos/usuario/${idUsuario}`
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo productos del usuario:', error);
      throw error;
    }
  }

  // ===== OBTENER PRODUCTOS DISPONIBLES (PÚBLICO - SIN AUTENTICACIÓN) =====
  async obtenerProductosDisponibles(filtros?: FiltrosProductos): Promise<ApiResponse<Producto[]>> {
    try {
      const queryParams = { ...filtros, disponible: true };
      const queryString = apiService.buildQueryString(queryParams);
      // ✅ Endpoint público - no requiere autenticación
      const response = await apiService.get<Producto[]>(
        `/productos/disponibles${queryString}`,
        false // No incluir token de autenticación
      );
      
      // Normalizar respuesta
      let productosData: Producto[] = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          productosData = response.data;
        } else if ((response as any).productos && Array.isArray((response as any).productos)) {
          productosData = (response as any).productos;
        }
      }
      
      return {
        success: response.success,
        data: productosData,
        message: response.message || `${productosData.length} productos disponibles`
      };
    } catch (error) {
      console.error('Error obteniendo productos disponibles:', error);
      throw error;
    }
  }

  // ===== SUBIR IMAGEN DE PRODUCTO =====
  async subirImagenProducto(idProducto: number, imagenFile: File): Promise<ApiResponse<{ path: string; url: string }>> {
    try {
      // Convertir archivo a base64
      const base64 = await this.fileToBase64(imagenFile);
      
      const response = await apiService.post<{ path: string; url: string }>(
        `/images/producto/${idProducto}`,
        { imageData: base64 }
      );
      return response;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  }

  // ===== SUBIR IMAGEN ADICIONAL DE PRODUCTO =====
  async subirImagenAdicional(idProducto: number, imagenFile: File): Promise<ApiResponse<{ path: string; url: string; index: number }>> {
    try {
      // Convertir archivo a base64
      const base64 = await this.fileToBase64(imagenFile);
      
      const response = await apiService.post<{ path: string; url: string; index: number }>(
        `/images/producto/${idProducto}/adicional`,
        { imageData: base64 }
      );
      return response;
    } catch (error) {
      console.error('Error subiendo imagen adicional:', error);
      throw error;
    }
  }

  // ===== ELIMINAR IMAGEN ADICIONAL DE PRODUCTO =====
  async eliminarImagenAdicional(idProducto: number, index: number): Promise<ApiResponse<{ imagenes_adicionales: string[] }>> {
    try {
      const response = await apiService.delete<{ imagenes_adicionales: string[] }>(
        `/images/producto/${idProducto}/adicional/${index}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando imagen adicional:', error);
      throw error;
    }
  }

  // ===== CONVERTIR ARCHIVO A BASE64 =====
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover el prefijo "data:image/...;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }
}

export const productosService = new ProductosService();
export default productosService;


