import { conexion } from './Conexion.ts';

export interface HistorialPrecioData {
  id_historial: number;
  id_producto: number;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_cambio: string;
  id_usuario_modifico: number | null;
}

export interface HistorialPrecioCreateData {
  id_producto: number;
  precio_anterior: number;
  precio_nuevo: number;
  id_usuario_modifico?: number | null;
}

export class HistorialPreciosModel {
  public _objHistorial: HistorialPrecioCreateData | null;

  constructor(objHistorial: HistorialPrecioCreateData | null = null) {
    this._objHistorial = objHistorial;
  }

  /**
   * Registra un cambio de precio en el historial
   */
  public async RegistrarCambioPrecio(): Promise<{ success: boolean; message: string; historial?: HistorialPrecioData }> {
    try {
      if (!this._objHistorial) {
        throw new Error('No se proporcionó un objeto de historial válido.');
      }

      const { id_producto, precio_anterior, precio_nuevo, id_usuario_modifico } = this._objHistorial;

      if (!id_producto || precio_anterior === undefined || precio_nuevo === undefined) {
        throw new Error('Faltan campos obligatorios: id_producto, precio_anterior, precio_nuevo.');
      }

      // Solo registrar si el precio realmente cambió
      if (precio_anterior === precio_nuevo) {
        return {
          success: true,
          message: 'El precio no ha cambiado, no se registró en el historial.',
        };
      }

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'INSERT INTO historial_precios (id_producto, precio_anterior, precio_nuevo, id_usuario_modifico) VALUES (?, ?, ?, ?)',
        [id_producto, precio_anterior, precio_nuevo, id_usuario_modifico || null]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevoHistorial] = await conexion.query(
          'SELECT * FROM historial_precios ORDER BY id_historial DESC LIMIT 1'
        );

        await conexion.execute('COMMIT');

        return {
          success: true,
          message: 'Cambio de precio registrado en el historial exitosamente.',
          historial: nuevoHistorial as HistorialPrecioData,
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se pudo registrar el cambio de precio.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al registrar cambio de precio:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al registrar cambio de precio.',
      };
    }
  }

  /**
   * Obtiene el historial de precios de un producto
   */
  public async ObtenerHistorialPorProducto(id_producto: number): Promise<HistorialPrecioData[]> {
    try {
      const result = await conexion.query(
        `SELECT h.*, u.nombre as nombre_usuario_modifico
         FROM historial_precios h
         LEFT JOIN usuarios u ON h.id_usuario_modifico = u.id_usuario
         WHERE h.id_producto = ?
         ORDER BY h.fecha_cambio DESC`,
        [id_producto]
      );
      return result as HistorialPrecioData[];
    } catch (error) {
      console.error('Error al obtener historial de precios:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los cambios de precio (con límite)
   */
  public async ListarHistorialPrecios(limit: number = 100): Promise<HistorialPrecioData[]> {
    try {
      const result = await conexion.query(
        `SELECT h.*, p.nombre as nombre_producto, u.nombre as nombre_usuario_modifico
         FROM historial_precios h
         INNER JOIN productos p ON h.id_producto = p.id_producto
         LEFT JOIN usuarios u ON h.id_usuario_modifico = u.id_usuario
         ORDER BY h.fecha_cambio DESC
         LIMIT ?`,
        [limit]
      );
      return result as HistorialPrecioData[];
    } catch (error) {
      console.error('Error al listar historial de precios:', error);
      return [];
    }
  }

  /**
   * Obtiene el último precio registrado de un producto
   */
  public async ObtenerUltimoPrecio(id_producto: number): Promise<HistorialPrecioData | null> {
    try {
      const result = await conexion.query(
        'SELECT * FROM historial_precios WHERE id_producto = ? ORDER BY fecha_cambio DESC LIMIT 1',
        [id_producto]
      );
      return result.length > 0 ? result[0] as HistorialPrecioData : null;
    } catch (error) {
      console.error('Error al obtener último precio:', error);
      return null;
    }
  }
}






