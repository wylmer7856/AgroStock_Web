import { conexion } from './Conexion.ts';

export interface NotificacionData {
  id_notificacion: number;
  id_usuario: number;
  titulo: string;
  mensaje: string;
  tipo: 'pedido' | 'stock' | 'precio' | 'mensaje' | 'sistema' | 'promocion';
  id_referencia: number | null;
  tipo_referencia: 'pedido' | 'producto' | 'mensaje' | 'usuario' | null;
  leida: boolean;
  fecha_creacion: string;
  fecha_leida: string | null;
}

export interface NotificacionCreateData {
  id_usuario: number;
  titulo: string;
  mensaje: string;
  tipo?: 'pedido' | 'stock' | 'precio' | 'mensaje' | 'sistema' | 'promocion';
  id_referencia?: number | null;
  tipo_referencia?: 'pedido' | 'producto' | 'mensaje' | 'usuario' | null;
}

export class NotificacionesModel {
  public _objNotificacion: NotificacionCreateData | null;

  constructor(objNotificacion: NotificacionCreateData | null = null) {
    this._objNotificacion = objNotificacion;
  }

  /**
   * Crea una nueva notificación
   */
  public async CrearNotificacion(): Promise<{ success: boolean; message: string; notificacion?: NotificacionData }> {
    try {
      if (!this._objNotificacion) {
        throw new Error('No se proporcionó un objeto de notificación válido.');
      }

      const { id_usuario, titulo, mensaje, tipo, id_referencia, tipo_referencia } = this._objNotificacion;

      if (!id_usuario || !titulo || !mensaje) {
        throw new Error('Faltan campos obligatorios: id_usuario, titulo, mensaje.');
      }

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_referencia, tipo_referencia) VALUES (?, ?, ?, ?, ?, ?)',
        [id_usuario, titulo, mensaje, tipo || 'sistema', id_referencia || null, tipo_referencia || null]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [nuevaNotificacion] = await conexion.query(
          'SELECT * FROM notificaciones ORDER BY id_notificacion DESC LIMIT 1'
        );

        await conexion.execute('COMMIT');

        return {
          success: true,
          message: 'Notificación creada exitosamente.',
          notificacion: nuevaNotificacion as NotificacionData,
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se pudo crear la notificación.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al crear notificación:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear notificación.',
      };
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  public async ObtenerNotificacionesPorUsuario(id_usuario: number, limit: number = 50, soloNoLeidas: boolean = false): Promise<NotificacionData[]> {
    try {
      let query = `
        SELECT * FROM notificaciones 
        WHERE id_usuario = ?
      `;
      
      const params: any[] = [id_usuario];

      if (soloNoLeidas) {
        query += ' AND leida = 0';
      }

      query += ' ORDER BY fecha_creacion DESC LIMIT ?';
      params.push(limit);

      const result = await conexion.query(query, params);
      return result as NotificacionData[];
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  }

  /**
   * Marca una notificación como leída
   */
  public async MarcarComoLeida(id_notificacion: number, id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'UPDATE notificaciones SET leida = 1, fecha_leida = CURRENT_TIMESTAMP WHERE id_notificacion = ? AND id_usuario = ?',
        [id_notificacion, id_usuario]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        return {
          success: true,
          message: 'Notificación marcada como leída exitosamente.',
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se encontró la notificación o no tienes permisos.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al marcar notificación como leída:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al marcar notificación como leída.',
      };
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  public async MarcarTodasComoLeidas(id_usuario: number): Promise<{ success: boolean; message: string; actualizadas: number }> {
    try {
      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'UPDATE notificaciones SET leida = 1, fecha_leida = CURRENT_TIMESTAMP WHERE id_usuario = ? AND leida = 0',
        [id_usuario]
      );

      const actualizadas = result.affectedRows || 0;

      await conexion.execute('COMMIT');

      return {
        success: true,
        message: `${actualizadas} notificación(es) marcada(s) como leída(s).`,
        actualizadas,
      };
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al marcar notificaciones como leídas.',
        actualizadas: 0,
      };
    }
  }

  /**
   * Elimina una notificación
   */
  public async EliminarNotificacion(id_notificacion: number, id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'DELETE FROM notificaciones WHERE id_notificacion = ? AND id_usuario = ?',
        [id_notificacion, id_usuario]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        return {
          success: true,
          message: 'Notificación eliminada exitosamente.',
        };
      } else {
        await conexion.execute('ROLLBACK');
        return {
          success: false,
          message: 'No se encontró la notificación o no tienes permisos.',
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error('Error al eliminar notificación:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar notificación.',
      };
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas de un usuario
   */
  public async ContarNoLeidas(id_usuario: number): Promise<number> {
    try {
      const result = await conexion.query(
        'SELECT COUNT(*) as total FROM notificaciones WHERE id_usuario = ? AND leida = 0',
        [id_usuario]
      );
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      return 0;
    }
  }
}






