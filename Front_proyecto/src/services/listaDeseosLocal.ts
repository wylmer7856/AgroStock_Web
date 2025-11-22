// ❤️ SERVICIO DE LISTA DE DESEOS LOCAL (localStorage) - Para usuarios no autenticados

import type { Producto } from '../types';

export interface ItemListaDeseosLocal {
  id_producto: number;
  producto_nombre: string;
  descripcion_producto?: string;
  precio?: number;
  stock?: number;
  unidad_medida?: string;
  imagen_principal?: string;
  disponible?: boolean;
  categoria_nombre?: string;
  nombre_productor?: string;
  fecha_agregado: string;
}

const LISTA_DESEOS_LOCAL_KEY = 'agrostock_lista_deseos_local';

class ListaDeseosLocalService {
  
  // ===== OBTENER LISTA DE DESEOS LOCAL =====
  obtenerListaDeseos(): ItemListaDeseosLocal[] {
    try {
      const listaStr = localStorage.getItem(LISTA_DESEOS_LOCAL_KEY);
      if (!listaStr) {
        return [];
      }
      return JSON.parse(listaStr);
    } catch (error) {
      console.error('Error obteniendo lista de deseos local:', error);
      return [];
    }
  }

  // ===== GUARDAR LISTA DE DESEOS LOCAL =====
  private guardarListaDeseos(lista: ItemListaDeseosLocal[]): void {
    try {
      localStorage.setItem(LISTA_DESEOS_LOCAL_KEY, JSON.stringify(lista));
    } catch (error) {
      console.error('Error guardando lista de deseos local:', error);
    }
  }

  // ===== AGREGAR A LISTA DE DESEOS LOCAL =====
  agregarAListaDeseos(producto: Producto): void {
    const lista = this.obtenerListaDeseos();
    
    // Verificar si ya existe
    if (lista.some(item => item.id_producto === producto.id_producto)) {
      return; // Ya está en la lista
    }

    const nuevoItem: ItemListaDeseosLocal = {
      id_producto: producto.id_producto,
      producto_nombre: producto.nombre,
      descripcion_producto: producto.descripcion || undefined,
      precio: producto.precio,
      stock: producto.stock,
      unidad_medida: producto.unidad_medida,
      imagen_principal: producto.imagenUrl || producto.imagen_principal || undefined,
      disponible: producto.disponible,
      categoria_nombre: producto.categoria_nombre,
      nombre_productor: producto.nombre_productor,
      fecha_agregado: new Date().toISOString(),
    };

    lista.push(nuevoItem);
    this.guardarListaDeseos(lista);
  }

  // ===== ELIMINAR DE LISTA DE DESEOS LOCAL =====
  eliminarDeListaDeseos(idProducto: number): void {
    const lista = this.obtenerListaDeseos();
    const nuevaLista = lista.filter(item => item.id_producto !== idProducto);
    this.guardarListaDeseos(nuevaLista);
  }

  // ===== LIMPIAR LISTA DE DESEOS LOCAL =====
  limpiarListaDeseos(): void {
    this.guardarListaDeseos([]);
  }

  // ===== VERIFICAR SI PRODUCTO ESTÁ EN LISTA =====
  verificarProductoEnLista(idProducto: number): boolean {
    const lista = this.obtenerListaDeseos();
    return lista.some(item => item.id_producto === idProducto);
  }

  // ===== SINCRONIZAR CON LISTA DEL SERVIDOR (cuando el usuario inicia sesión) =====
  async sincronizarConServidor(listaDeseosService: any): Promise<void> {
    const listaLocal = this.obtenerListaDeseos();
    
    if (listaLocal.length === 0) return;

    try {
      // Agregar cada producto de la lista local a la lista del servidor
      for (const item of listaLocal) {
        try {
          await listaDeseosService.agregarAListaDeseos(item.id_producto);
        } catch (error) {
          // Si ya existe en el servidor, continuar
          console.warn(`Producto ${item.id_producto} ya está en la lista del servidor`);
        }
      }
      
      // Limpiar lista local después de sincronizar
      this.limpiarListaDeseos();
    } catch (error) {
      console.error('Error sincronizando lista de deseos:', error);
    }
  }
}

export const listaDeseosLocalService = new ListaDeseosLocalService();
export default listaDeseosLocalService;

