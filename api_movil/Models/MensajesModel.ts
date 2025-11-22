import { conexion } from "./Conexion.ts";

// Tipo para filas de mensajes de la base de datos
interface MensajeRow {
  id_mensaje: number;
  id_remitente: number;
  id_destinatario: number;
  id_producto?: number | null;
  asunto: string;
  mensaje: string;
  fecha_envio: Date | string;
  leido: number | boolean;
  tipo_mensaje: 'consulta' | 'pedido' | 'general';
  nombre_remitente?: string;
  email_remitente?: string;
  nombre_destinatario?: string;
  email_destinatario?: string;
  nombre_producto?: string;
  [key: string]: unknown; // Para campos adicionales
}

export interface MensajeData {
  id_mensaje: number;
  id_remitente: number;
  id_destinatario: number;
  id_producto?: number;
  asunto: string;
  mensaje: string;
  fecha_envio: Date;
  leido: boolean;
  tipo_mensaje: 'consulta' | 'pedido' | 'general';
}

export interface MensajeCreateData {
  id_remitente: number;
  id_destinatario: number;
  id_producto?: number;
  asunto: string;
  mensaje: string;
  tipo_mensaje?: 'consulta' | 'pedido' | 'general';
}

export class MensajesModel {
  public _objMensaje: MensajeCreateData | null;

  constructor(objMensaje: MensajeCreateData | null = null) {
    this._objMensaje = objMensaje;
  }

  // 📌 Crear nuevo mensaje
  public async CrearMensaje(): Promise<{ success: boolean; message: string; mensaje?: MensajeData }> {
    try {
      console.log('💾 [MensajesModel.CrearMensaje] Iniciando creación de mensaje');
      
      if (!this._objMensaje) {
        console.error('❌ [MensajesModel.CrearMensaje] No se proporcionó objeto de mensaje');
        throw new Error("No se ha proporcionado un objeto de mensaje válido.");
      }

      const { id_remitente, id_destinatario, id_producto, asunto, mensaje, tipo_mensaje } = this._objMensaje;
      console.log('📋 [MensajesModel.CrearMensaje] Datos del mensaje:', {
        id_remitente,
        id_destinatario,
        id_producto,
        asunto: asunto?.substring(0, 50),
        mensaje: mensaje?.substring(0, 50),
        tipo_mensaje
      });

      if (!id_remitente || !id_destinatario || !asunto || !mensaje) {
        console.error('❌ [MensajesModel.CrearMensaje] Faltan campos requeridos:', {
          id_remitente: !!id_remitente,
          id_destinatario: !!id_destinatario,
          asunto: !!asunto,
          mensaje: !!mensaje
        });
        throw new Error("Faltan campos requeridos para crear el mensaje.");
      }

      // Intentar sin transacción primero para ver si el problema es la transacción
      console.log('🔄 [MensajesModel.CrearMensaje] Insertando mensaje (SIN transacción para debug)');
      
      const insertQuery = "INSERT INTO mensajes (id_remitente, id_destinatario, id_producto, asunto, mensaje, tipo_mensaje) VALUES (?, ?, ?, ?, ?, ?)";
      const insertParams = [id_remitente, id_destinatario, id_producto || null, asunto, mensaje, tipo_mensaje || 'consulta'];
      
      console.log('📝 [MensajesModel.CrearMensaje] Ejecutando INSERT:', {
        query: insertQuery,
        params: insertParams.map((p, i) => i === 4 ? `${String(p).substring(0, 50)}...` : p) // Ocultar mensaje completo en logs
      });

      // Insertar directamente sin transacción para verificar si el problema es la transacción
      const result = await conexion.execute(insertQuery, insertParams);
      console.log('✅ [MensajesModel.CrearMensaje] Resultado del INSERT:', {
        affectedRows: result?.affectedRows,
        result: result
      });

      if (result && result.affectedRows && result.affectedRows > 0) {
        // Obtener el ID del mensaje insertado consultando la BD
        const mensajesRecientes = await conexion.query(
          "SELECT id_mensaje FROM mensajes ORDER BY id_mensaje DESC LIMIT 1"
        ) as MensajeRow[];
        const insertId = mensajesRecientes.length > 0 ? mensajesRecientes[0].id_mensaje : null;
        console.log('🔍 [MensajesModel.CrearMensaje] Mensaje insertado con ID:', insertId);
        
        // Obtener el mensaje recién creado usando el insertId si está disponible
        let nuevoMensaje: MensajeRow | undefined;
        if (insertId) {
          const mensajes = await conexion.query("SELECT * FROM mensajes WHERE id_mensaje = ?", [insertId]) as MensajeRow[];
          nuevoMensaje = mensajes[0];
          console.log('📬 [MensajesModel.CrearMensaje] Mensaje obtenido por insertId:', nuevoMensaje);
        } else {
          // Fallback: obtener el último mensaje
          const mensajes = await conexion.query("SELECT * FROM mensajes ORDER BY id_mensaje DESC LIMIT 1") as MensajeRow[];
          nuevoMensaje = mensajes[0];
          console.log('📬 [MensajesModel.CrearMensaje] Mensaje obtenido (último):', nuevoMensaje);
        }
        
        // Verificar que el mensaje tiene los datos correctos
        if (nuevoMensaje) {
          console.log('✅ [MensajesModel.CrearMensaje] Mensaje verificado:', {
            id_mensaje: nuevoMensaje.id_mensaje,
            id_remitente: nuevoMensaje.id_remitente,
            id_destinatario: nuevoMensaje.id_destinatario,
            asunto: nuevoMensaje.asunto?.substring(0, 30)
          });
        } else {
          console.error('❌ [MensajesModel.CrearMensaje] No se pudo obtener el mensaje creado');
        }
        
        // Actualizar estadísticas del destinatario (no crítico si falla)
        try {
          await this.actualizarEstadisticasDestinatario(id_destinatario);
        } catch (statsError) {
          console.warn('⚠️ [MensajesModel.CrearMensaje] Error al actualizar estadísticas (no crítico):', statsError);
        }

        // No hay COMMIT porque no usamos transacción (para debug)
        console.log('✅ [MensajesModel.CrearMensaje] Mensaje insertado directamente (sin transacción)');

        // VERIFICACIÓN FINAL: Consultar directamente en la BD para confirmar que el mensaje existe
        const verificacion = await conexion.query(
          "SELECT * FROM mensajes WHERE id_mensaje = ?",
          [insertId || nuevoMensaje?.id_mensaje]
        );
        console.log('🔍 [MensajesModel.CrearMensaje] VERIFICACIÓN FINAL en BD:', {
          insertId: insertId || nuevoMensaje?.id_mensaje,
          encontrado: verificacion.length > 0,
          mensaje: verificacion[0] ? {
            id_mensaje: verificacion[0].id_mensaje,
            id_remitente: verificacion[0].id_remitente,
            id_destinatario: verificacion[0].id_destinatario,
            asunto: verificacion[0].asunto?.substring(0, 30)
          } : null
        });

        if (verificacion.length === 0) {
          console.error('❌❌❌ [MensajesModel.CrearMensaje] ERROR CRÍTICO: El mensaje NO existe en la BD después del COMMIT!');
          return {
            success: false,
            message: "El mensaje no se pudo guardar en la base de datos.",
          };
        }

        return {
          success: true,
          message: "Mensaje enviado exitosamente.",
          mensaje: nuevoMensaje as MensajeData,
        };
      } else {
        console.error('❌ [MensajesModel.CrearMensaje] No se insertaron filas:', result);
        throw new Error("No se pudo crear el mensaje. No se insertaron filas en la base de datos.");
      }
    } catch (error) {
      console.error('❌ [MensajesModel.CrearMensaje] Error capturado:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      // No hay rollback porque no usamos transacción
      console.log('⚠️ [MensajesModel.CrearMensaje] Error capturado, no se hizo rollback (no hay transacción activa)');
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener mensajes recibidos por usuario
  public async ObtenerMensajesRecibidos(id_usuario: number): Promise<MensajeData[]> {
    try {
      const result = await conexion.query(`
        SELECT m.*, 
               u_remitente.nombre as nombre_remitente,
               u_remitente.email as email_remitente,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_remitente ON m.id_remitente = u_remitente.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        WHERE m.id_destinatario = ?
        ORDER BY m.fecha_envio DESC
      `, [id_usuario]);
      
      return result as MensajeData[];
    } catch (error) {
      console.error("Error al obtener mensajes recibidos:", error);
      return [];
    }
  }

  // 📌 Obtener mensajes enviados por usuario
  public async ObtenerMensajesEnviados(id_usuario: number): Promise<MensajeData[]> {
    try {
      // Asegurar que id_usuario sea un número entero
      const userId = parseInt(String(id_usuario), 10);
      
      console.log('🔍 [MensajesModel.ObtenerMensajesEnviados] Buscando mensajes enviados por usuario:', userId, 'tipo:', typeof userId);
      
      // Primero, verificar todos los mensajes en la BD para debug
      const todosMensajes = await conexion.query("SELECT id_mensaje, id_remitente, id_destinatario, asunto, fecha_envio FROM mensajes ORDER BY fecha_envio DESC LIMIT 20") as MensajeRow[];
      console.log('🔍 [MensajesModel.ObtenerMensajesEnviados] Últimos 20 mensajes en BD:', todosMensajes.map((m: MensajeRow) => ({
        id_mensaje: m.id_mensaje,
        id_remitente: m.id_remitente,
        id_remitente_tipo: typeof m.id_remitente,
        id_destinatario: m.id_destinatario,
        asunto: m.asunto?.substring(0, 30),
        fecha: m.fecha_envio
      })));
      
      // Usar CAST para asegurar comparación numérica
      const query = `
        SELECT m.*, 
               u_destinatario.nombre as nombre_destinatario,
               u_destinatario.email as email_destinatario,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_destinatario ON m.id_destinatario = u_destinatario.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        WHERE CAST(m.id_remitente AS UNSIGNED) = CAST(? AS UNSIGNED)
        ORDER BY m.fecha_envio DESC
      `;
      
      console.log('📝 [MensajesModel.ObtenerMensajesEnviados] Ejecutando query con CAST');
      console.log('📝 [MensajesModel.ObtenerMensajesEnviados] Parámetro userId:', userId);
      
      const result = await conexion.query(query, [userId]);
      
      console.log('✅ [MensajesModel.ObtenerMensajesEnviados] Resultado de la query:', {
        total: result.length,
        mensajes: (result as MensajeRow[]).map((m: MensajeRow) => ({
          id_mensaje: m.id_mensaje,
          id_remitente: m.id_remitente,
          id_remitente_tipo: typeof m.id_remitente,
          id_destinatario: m.id_destinatario,
          asunto: m.asunto?.substring(0, 30)
        }))
      });
      
      // Verificación adicional: consulta simple sin JOINs
      const mensajesSimples = await conexion.query(
        "SELECT id_mensaje, id_remitente, id_destinatario, asunto FROM mensajes WHERE id_remitente = ? ORDER BY fecha_envio DESC",
        [userId]
      );
      console.log('🔍 [MensajesModel.ObtenerMensajesEnviados] Consulta simple (sin JOINs):', mensajesSimples.length, 'mensajes encontrados');
      
      // Si la consulta simple encuentra mensajes pero la compleja no, hay un problema con los JOINs
      if (mensajesSimples.length > 0 && result.length === 0) {
        console.error('⚠️ [MensajesModel.ObtenerMensajesEnviados] PROBLEMA: La consulta simple encontró mensajes pero la compleja no!');
        // Retornar usando la consulta simple y agregar los datos faltantes después
        const mensajesConDatos = await Promise.all((mensajesSimples as MensajeRow[]).map(async (msg: MensajeRow) => {
          const [destinatario] = await conexion.query("SELECT nombre, email FROM usuarios WHERE id_usuario = ?", [msg.id_destinatario]);
          const [producto] = msg.id_producto ? await conexion.query("SELECT nombre FROM productos WHERE id_producto = ?", [msg.id_producto]) : [null];
          return {
            ...msg,
            nombre_destinatario: destinatario?.nombre || null,
            email_destinatario: destinatario?.email || null,
            nombre_producto: producto?.nombre || null
          };
        }));
        return mensajesConDatos as MensajeData[];
      }
      
      return result as MensajeData[];
    } catch (error) {
      console.error("❌ [MensajesModel.ObtenerMensajesEnviados] Error:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      return [];
    }
  }

  // 📌 Marcar mensaje como leído
  public async MarcarComoLeido(id_mensaje: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "UPDATE mensajes SET leido = 1 WHERE id_mensaje = ?",
        [id_mensaje]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Mensaje marcado como leído.",
        };
      } else {
        return {
          success: false,
          message: "No se pudo marcar el mensaje como leído.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar mensaje
  public async EliminarMensaje(id_mensaje: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "DELETE FROM mensajes WHERE id_mensaje = ?",
        [id_mensaje]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Mensaje eliminado correctamente.",
        };
      } else {
        return {
          success: false,
          message: "No se encontró el mensaje a eliminar.",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Obtener mensajes no leídos
  public async ObtenerMensajesNoLeidos(id_usuario: number): Promise<number> {
    try {
      const result = await conexion.query(
        "SELECT COUNT(*) as total FROM mensajes WHERE id_destinatario = ? AND leido = 0",
        [id_usuario]
      );
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error("Error al obtener mensajes no leídos:", error);
      return 0;
    }
  }

  // 📌 Obtener conversación entre dos usuarios
  public async ObtenerConversacion(id_usuario1: number, id_usuario2: number): Promise<MensajeData[]> {
    try {
      const result = await conexion.query(`
        SELECT m.*, 
               u_remitente.nombre as nombre_remitente,
               u_destinatario.nombre as nombre_destinatario,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_remitente ON m.id_remitente = u_remitente.id_usuario
        LEFT JOIN usuarios u_destinatario ON m.id_destinatario = u_destinatario.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        WHERE (m.id_remitente = ? AND m.id_destinatario = ?) 
           OR (m.id_remitente = ? AND m.id_destinatario = ?)
        ORDER BY m.fecha_envio ASC
      `, [id_usuario1, id_usuario2, id_usuario2, id_usuario1]);
      
      return result as MensajeData[];
    } catch (error) {
      console.error("Error al obtener conversación:", error);
      return [];
    }
  }

  // 📌 Actualizar estadísticas del destinatario
  private async actualizarEstadisticasDestinatario(id_usuario: number): Promise<void> {
    try {
      // Verificar si existe registro de estadísticas
      const existe = await conexion.query(
        "SELECT id_usuario FROM estadisticas_usuarios WHERE id_usuario = ?",
        [id_usuario]
      );

      if (existe.length === 0) {
        // Crear registro inicial
        await conexion.execute(
          "INSERT INTO estadisticas_usuarios (id_usuario, total_mensajes_recibidos) VALUES (?, 1)",
          [id_usuario]
        );
      } else {
        // Actualizar contador
        await conexion.execute(
          "UPDATE estadisticas_usuarios SET total_mensajes_recibidos = total_mensajes_recibidos + 1 WHERE id_usuario = ?",
          [id_usuario]
        );
      }
    } catch (error) {
      console.error("Error al actualizar estadísticas:", error);
    }
  }
}
