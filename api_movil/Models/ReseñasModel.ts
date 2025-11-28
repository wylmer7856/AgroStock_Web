import { conexion } from "./Conexion.ts";

interface ResenaData {
  id_resena: number | null;
  id_pedido: number;      // FK a pedido
  id_producto: number;     // FK a producto
  id_consumidor: number; // FK a usuario (consumidor)
  id_productor: number;   // FK a usuario (productor)
  calificacion: number;   // 1 a 5 estrellas
  comentario: string | null;
  fecha_resena: string | null;
}

export class Resena {
  public _objResena: ResenaData | null;

  constructor(objResena: ResenaData | null = null) {
    this._objResena = objResena;
  }

  // 📌 Listar todas las reseñas
  public async ListarResenas(): Promise<ResenaData[]> {
    try {
      const result = await conexion.query("SELECT * FROM reseñas ORDER BY fecha_resena DESC");
      return result as ResenaData[];
    } catch (error) {
      console.error("Error al consultar las reseñas: ", error);
      throw new Error("No se pudieron obtener las reseñas.");
    }
  }

  // 📌 Insertar reseña
  public async InsertarResena(): Promise<{ success: boolean; message: string; resena?: Record<string, unknown> }> {
    try {
      if (!this._objResena) {
        throw new Error("No se ha proporcionado un objeto válido.");
      }

      const { id_pedido, id_producto, id_consumidor, id_productor, calificacion, comentario } = this._objResena;

      // id_pedido es opcional, pero los demás campos son requeridos
      if (!id_producto || !id_consumidor || !id_productor || !calificacion) {
        throw new Error("Faltan campos requeridos para insertar reseña.");
      }

      // Verificar que la calificación esté entre 1 y 5
      if (calificacion < 1 || calificacion > 5) {
        throw new Error("La calificación debe estar entre 1 y 5.");
      }

      await conexion.execute("START TRANSACTION");

      // Como id_pedido es NOT NULL en la BD, necesitamos un valor válido
      // Si no hay id_pedido, buscar un pedido existente del usuario o usar uno por defecto
      let id_pedido_final = id_pedido;
      
      if (!id_pedido_final || id_pedido_final <= 0) {
        try {
          // Buscar si el usuario tiene algún pedido existente
          const [pedidoExistente] = await conexion.query(
            `SELECT id_pedido FROM pedidos 
             WHERE id_consumidor = ? 
             ORDER BY id_pedido DESC 
             LIMIT 1`,
            [id_consumidor]
          ) as Array<{ id_pedido: number }>;
          
          if (pedidoExistente && pedidoExistente.id_pedido) {
            // Usar el último pedido del usuario como referencia
            id_pedido_final = pedidoExistente.id_pedido;
            console.log(`[ReseñasModel] Usando pedido existente del usuario: ${id_pedido_final}`);
          } else {
            // Si el usuario no tiene pedidos, buscar un pedido "sistema" compartido
            // Buscar un pedido con notas que indique que es para reseñas sin pedido
            const [pedidoSistema] = await conexion.query(
              `SELECT id_pedido FROM pedidos 
               WHERE notas LIKE '%Reseña sin pedido%' OR notas LIKE '%Pedido virtual%'
               LIMIT 1`
            ) as Array<{ id_pedido: number }>;
            
            if (pedidoSistema && pedidoSistema.id_pedido) {
              id_pedido_final = pedidoSistema.id_pedido;
              console.log(`[ReseñasModel] Usando pedido sistema compartido: ${id_pedido_final}`);
            } else {
              // Crear un pedido "sistema" compartido para todas las reseñas sin pedido
              const resultadoPedido = await conexion.execute(
                `INSERT INTO pedidos (id_consumidor, id_productor, total, estado, direccion_entrega, metodo_pago, estado_pago, notas)
                 VALUES (?, ?, 0, 'completado', 'Sistema', 'efectivo', 'pagado', 'Pedido sistema para reseñas sin pedido asociado')`,
                [id_consumidor, id_productor]
              );
              
              const [nuevoPedido] = await conexion.query("SELECT LAST_INSERT_ID() as id_pedido") as Array<{ id_pedido: number }>;
              id_pedido_final = nuevoPedido[0]?.id_pedido;
              console.log(`[ReseñasModel] Creado pedido sistema para reseñas: ${id_pedido_final}`);
            }
          }
        } catch (error) {
          console.error("[ReseñasModel] Error al obtener/crear pedido para reseña:", error);
          // Si todo falla, intentar usar el primer pedido disponible en el sistema
          const [primerPedido] = await conexion.query(
            "SELECT id_pedido FROM pedidos ORDER BY id_pedido ASC LIMIT 1"
          ) as Array<{ id_pedido: number }>;
          
          if (primerPedido && primerPedido.id_pedido) {
            id_pedido_final = primerPedido.id_pedido;
            console.log(`[ReseñasModel] Usando primer pedido disponible: ${id_pedido_final}`);
          } else {
            throw new Error("No se pudo encontrar un pedido válido para asociar la reseña. La base de datos requiere al menos un pedido existente.");
          }
        }
      }

      // Insertar la reseña con id_pedido válido
      const result = await conexion.execute(
        "INSERT INTO reseñas (id_pedido, id_producto, id_consumidor, id_productor, calificacion, comentario) VALUES (?, ?, ?, ?, ?, ?)",
        [id_pedido_final, id_producto, id_consumidor, id_productor, calificacion, comentario || null]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [resena] = await conexion.query("SELECT * FROM reseñas ORDER BY id_resena DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Reseña insertada con éxito.",
          resena: resena,
        };
      } else {
        throw new Error("No se pudo insertar la reseña.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar reseña
  public async EliminarResena(id_resena: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM reseñas WHERE id_resena = ?", [id_resena]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Reseña eliminada correctamente.",
        };
      } else {
        throw new Error("No se encontró la reseña a eliminar.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Editar reseña
  public async EditarResena(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objResena || !this._objResena.id_resena) {
        throw new Error("No se ha proporcionado una reseña válida con ID.");
      }

      const { id_resena, calificacion, comentario } = this._objResena;

      // Verificar que la calificación esté entre 1 y 5
      if (calificacion && (calificacion < 1 || calificacion > 5)) {
        throw new Error("La calificación debe estar entre 1 y 5.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "UPDATE reseñas SET calificacion = ?, comentario = ? WHERE id_resena = ?",
        [calificacion, comentario || null, id_resena]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Reseña actualizada correctamente.",
        };
      } else {
        throw new Error("No se pudo actualizar la reseña o no se encontró.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Buscar reseñas de un producto con información del usuario
  public async BuscarPorProducto(id_producto: number): Promise<ResenaData[]> {
    try {
      const result = await conexion.query(
        `SELECT r.*, 
                u.nombre as nombre_consumidor,
                u.email as email_consumidor,
                p.nombre as nombre_producto
         FROM reseñas r
         INNER JOIN usuarios u ON r.id_consumidor = u.id_usuario
         INNER JOIN productos p ON r.id_producto = p.id_producto
         WHERE r.id_producto = ? 
         ORDER BY r.fecha_resena DESC`,
        [id_producto]
      );
      
      return result as ResenaData[];
    } catch (error) {
      console.error("Error al buscar reseñas por producto: ", error);
      return [];
    }
  }

  // 📌 Obtener promedio de calificaciones de un producto
  public async obtenerPromedioCalificacion(id_producto: number): Promise<{ promedio: number; total: number }> {
    try {
      const result = await conexion.query(
        `SELECT 
          COALESCE(AVG(calificacion), 0) as promedio,
          COUNT(*) as total
         FROM reseñas 
         WHERE id_producto = ?`,
        [id_producto]
      ) as Array<{ promedio: number | string; total: number | string }>;
      
      if (result.length > 0 && result[0]) {
        const promedioValue = typeof result[0].promedio === 'string' 
          ? parseFloat(result[0].promedio) 
          : (result[0].promedio || 0);
        const totalValue = typeof result[0].total === 'string'
          ? parseInt(result[0].total, 10)
          : (result[0].total || 0);
        
        console.log(`[ReseñasModel] obtenerPromedioCalificacion - ID: ${id_producto}, Promedio: ${promedioValue}, Total: ${totalValue}`);
        
        return {
          promedio: Number(promedioValue.toFixed(1)),
          total: Number(totalValue)
        };
      }
      return { promedio: 0, total: 0 };
    } catch (error) {
      console.error("Error al obtener promedio de calificaciones: ", error);
      return { promedio: 0, total: 0 };
    }
  }
}
