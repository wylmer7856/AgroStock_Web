import { conexion } from './Conexion.ts';

export interface ListaDeseoData {
  id_lista: number;
  id_usuario: number;
  id_producto: number;
  fecha_agregado: string;
}

export interface ListaDeseoCreateData {
  id_usuario: number;
  id_producto: number;
}

export class ListaDeseosModel {
  public _objListaDeseo: ListaDeseoCreateData | null;

  constructor(objListaDeseo: ListaDeseoCreateData | null = null) {
    this._objListaDeseo = objListaDeseo;
  }

  /**
   * Agrega un producto a la lista de deseos
   */
  public async AgregarAListaDeseos(): Promise<{ success: boolean; message: string; listaDeseo?: ListaDeseoData }> {
    try {
      if (!this._objListaDeseo) {
        throw new Error('No se proporcionó un objeto de lista de deseos válido.');
      }

      const { id_usuario, id_producto } = this._objListaDeseo;

      if (!id_usuario || !id_producto) {
        throw new Error('Faltan campos obligatorios: id_usuario, id_producto.');
      }

      // Verificar si el producto ya está en la lista de deseos
      const existe = await conexion.query(
        'SELECT * FROM lista_deseos WHERE id_usuario = ? AND id_producto = ?',
        [id_usuario, id_producto]
      );

      if (existe.length > 0) {
        return {
          success: false,
          message: 'El producto ya está en tu lista de deseos.',
        };
      }

      // Verificar que el producto existe y está disponible
      const producto = await conexion.query(
        'SELECT * FROM productos WHERE id_producto = ?',
        [id_producto]
      );

      if (producto.length === 0) {
        return {
          success: false,
          message: 'El producto no existe.',
        };
      }

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'INSERT INTO lista_deseos (id_usuario, id_producto) VALUES (?, ?)',
        [id_usuario, id_producto]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevaListaDeseo] = await conexion.query(
          'SELECT * FROM lista_deseos ORDER BY id_lista DESC LIMIT 1'
        );

        await conexion.execute('COMMIT');

        return {
          success: true,
          message: 'Producto agregado a la lista de deseos exitosamente.',
          listaDeseo: nuevaListaDeseo as ListaDeseoData,
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se pudo agregar el producto a la lista de deseos.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al agregar a lista de deseos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al agregar a lista de deseos.',
      };
    }
  }

  /**
   * Obtiene la lista de deseos de un usuario con información del producto
   */
  public async ObtenerListaDeseosPorUsuario(id_usuario: number): Promise<any[]> {
    try {
      const result = await conexion.query(
        `SELECT 
           l.*,
           p.nombre as nombre_producto,
           p.descripcion as descripcion_producto,
           p.precio,
           p.stock,
           p.unidad_medida,
           p.imagen_principal,
           p.disponible,
           p.id_categoria,
           c.nombre as categoria_nombre,
           u.nombre as nombre_productor
         FROM lista_deseos l
         INNER JOIN productos p ON l.id_producto = p.id_producto
         LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
         INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
         WHERE l.id_usuario = ?
         ORDER BY l.fecha_agregado DESC`,
        [id_usuario]
      );
      return result;
    } catch (error) {
      console.error('Error al obtener lista de deseos:', error);
      return [];
    }
  }

  /**
   * Elimina un producto de la lista de deseos
   */
  public async EliminarDeListaDeseos(id_lista: number, id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'DELETE FROM lista_deseos WHERE id_lista = ? AND id_usuario = ?',
        [id_lista, id_usuario]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        return {
          success: true,
          message: 'Producto eliminado de la lista de deseos exitosamente.',
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se encontró el producto en tu lista de deseos o no tienes permisos.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al eliminar de lista de deseos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar de lista de deseos.',
      };
    }
  }

  /**
   * Elimina un producto de la lista de deseos por id_producto
   */
  public async EliminarProductoDeListaDeseos(id_producto: number, id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'DELETE FROM lista_deseos WHERE id_producto = ? AND id_usuario = ?',
        [id_producto, id_usuario]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        return {
          success: true,
          message: 'Producto eliminado de la lista de deseos exitosamente.',
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se encontró el producto en tu lista de deseos.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al eliminar producto de lista de deseos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar producto de lista de deseos.',
      };
    }
  }

  /**
   * Limpia toda la lista de deseos de un usuario
   */
  public async LimpiarListaDeseos(id_usuario: number): Promise<{ success: boolean; message: string; eliminados: number }> {
    try {
      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'DELETE FROM lista_deseos WHERE id_usuario = ?',
        [id_usuario]
      );

      const eliminados = result.affectedRows || 0;

      await conexion.execute('COMMIT');

      return {
        success: true,
        message: `${eliminados} producto(s) eliminado(s) de la lista de deseos.`,
        eliminados,
      };
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al limpiar lista de deseos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al limpiar lista de deseos.',
        eliminados: 0,
      };
    }
  }

  /**
   * Verifica si un producto está en la lista de deseos del usuario
   */
  public async VerificarProductoEnLista(id_producto: number, id_usuario: number): Promise<boolean> {
    try {
      const result = await conexion.query(
        'SELECT * FROM lista_deseos WHERE id_producto = ? AND id_usuario = ?',
        [id_producto, id_usuario]
      );
      return result.length > 0;
    } catch (error) {
      console.error('Error al verificar producto en lista de deseos:', error);
      return false;
    }
  }
}






