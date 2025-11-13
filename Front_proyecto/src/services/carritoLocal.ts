// 🛒 SERVICIO DE CARRITO LOCAL (localStorage) - Para usuarios no autenticados

import type { Producto } from '../types';

export interface ItemCarritoLocal {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  producto_nombre: string;
  imagen_principal?: string;
  disponible: boolean;
  stock_actual: number;
  unidad_medida: string;
}

export interface CarritoLocal {
  items: ItemCarritoLocal[];
  fecha_actualizacion: string;
}

const CARRITO_LOCAL_KEY = 'agrostock_carrito_local';

class CarritoLocalService {
  
  // ===== OBTENER CARRITO LOCAL =====
  obtenerCarrito(): CarritoLocal {
    try {
      const carritoStr = localStorage.getItem(CARRITO_LOCAL_KEY);
      if (!carritoStr) {
        return { items: [], fecha_actualizacion: new Date().toISOString() };
      }
      return JSON.parse(carritoStr);
    } catch (error) {
      console.error('Error obteniendo carrito local:', error);
      return { items: [], fecha_actualizacion: new Date().toISOString() };
    }
  }

  // ===== GUARDAR CARRITO LOCAL =====
  private guardarCarrito(carrito: CarritoLocal): void {
    try {
      carrito.fecha_actualizacion = new Date().toISOString();
      localStorage.setItem(CARRITO_LOCAL_KEY, JSON.stringify(carrito));
    } catch (error) {
      console.error('Error guardando carrito local:', error);
    }
  }

  // ===== AGREGAR AL CARRITO LOCAL =====
  agregarAlCarrito(producto: Producto, cantidad: number = 1): void {
    const carrito = this.obtenerCarrito();
    const itemExistente = carrito.items.find(item => item.id_producto === producto.id_producto);

    if (itemExistente) {
      // Actualizar cantidad
      itemExistente.cantidad += cantidad;
      itemExistente.precio_total = itemExistente.precio_unitario * itemExistente.cantidad;
    } else {
      // Agregar nuevo item
      const nuevoItem: ItemCarritoLocal = {
        id_producto: producto.id_producto,
        cantidad,
        precio_unitario: producto.precio,
        precio_total: producto.precio * cantidad,
        producto_nombre: producto.nombre,
        imagen_principal: producto.imagenUrl || producto.imagen_principal || undefined,
        disponible: producto.disponible,
        stock_actual: producto.stock,
        unidad_medida: producto.unidad_medida,
      };
      carrito.items.push(nuevoItem);
    }

    this.guardarCarrito(carrito);
  }

  // ===== ACTUALIZAR CANTIDAD =====
  actualizarCantidad(idProducto: number, cantidad: number): void {
    if (cantidad < 1) {
      this.eliminarItem(idProducto);
      return;
    }

    const carrito = this.obtenerCarrito();
    const item = carrito.items.find(item => item.id_producto === idProducto);
    
    if (item) {
      item.cantidad = cantidad;
      item.precio_total = item.precio_unitario * cantidad;
      this.guardarCarrito(carrito);
    }
  }

  // ===== ELIMINAR ITEM =====
  eliminarItem(idProducto: number): void {
    const carrito = this.obtenerCarrito();
    carrito.items = carrito.items.filter(item => item.id_producto !== idProducto);
    this.guardarCarrito(carrito);
  }

  // ===== LIMPIAR CARRITO =====
  limpiarCarrito(): void {
    this.guardarCarrito({ items: [], fecha_actualizacion: new Date().toISOString() });
  }

  // ===== OBTENER TOTAL =====
  obtenerTotal(): number {
    const carrito = this.obtenerCarrito();
    return carrito.items.reduce((sum, item) => sum + item.precio_total, 0);
  }

  // ===== OBTENER CANTIDAD TOTAL DE ITEMS =====
  obtenerCantidadTotal(): number {
    const carrito = this.obtenerCarrito();
    return carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
  }

  // ===== SINCRONIZAR CON CARRITO DEL SERVIDOR (cuando el usuario inicia sesión) =====
  async sincronizarConServidor(carritoService: any): Promise<void> {
    const carritoLocal = this.obtenerCarrito();
    
    if (carritoLocal.items.length === 0) return;

    try {
      // Agregar cada item del carrito local al carrito del servidor
      for (const item of carritoLocal.items) {
        await carritoService.agregarAlCarrito({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
        });
      }
      
      // Limpiar carrito local después de sincronizar
      this.limpiarCarrito();
    } catch (error) {
      console.error('Error sincronizando carrito:', error);
    }
  }
}

export const carritoLocalService = new CarritoLocalService();
export default carritoLocalService;

