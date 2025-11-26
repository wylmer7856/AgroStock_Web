import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { PedidosModel } from "../Models/PedidosModel.ts";
import { conexion } from "../Models/Conexion.ts";

// Tipo para pedidos obtenidos de la base de datos
interface PedidoDB {
  id_pedido: number;
  id_consumidor: number;
  id_productor: number;
  total: number;
  estado: "pendiente" | "confirmado" | "en_preparacion" | "en_camino" | "entregado" | "cancelado";
  direccion_entrega: string;
  id_ciudad_entrega?: number | null;
  metodo_pago: "efectivo" | "transferencia" | "nequi" | "daviplata" | "pse" | "tarjeta";
  estado_pago?: "pendiente" | "pagado" | "reembolsado";
  notas?: string | null;
  fecha_pedido?: string | null;
  fecha_entrega?: string | null;
  [key: string]: unknown; // Para campos adicionales de JOINs
}

const pedidoSchemaBase = z.object({
  id_consumidor: z.number().int().positive(),
  id_productor: z.number().int().positive(),
  fecha: z.string().refine((date: string) => !isNaN(Date.parse(date)), {}).transform((date: string) => new Date(date)).optional(),
  estado: z.enum(["pendiente", "confirmado", "en_preparacion", "en_camino", "entregado", "cancelado"], {}).optional(),
  total: z.number().positive().optional(),
  direccionEntrega: z.string().min(5).optional(),
  direccion_entrega: z.string().min(5).optional(), // Alias
  notas: z.string().optional(),
  fecha_entrega_estimada: z.string().refine((date: string) => !isNaN(Date.parse(date)), {}).transform((date: string) => new Date(date)).optional(),
  metodo_pago: z.enum(["efectivo", "transferencia", "nequi", "daviplata", "pse", "tarjeta"], {}),
  // Array de productos para crear pedido con detalles
  productos: z.array(z.object({
    id_producto: z.number().int().positive(),
    cantidad: z.number().int().positive(),
    precio_unitario: z.number().positive(),
  })).optional(),
});

const pedidoSchema = pedidoSchemaBase.refine((data) => data.direccionEntrega || data.direccion_entrega, {
  message: "Debe proporcionar una dirección de entrega",
  path: ["direccionEntrega"],
});

const pedidoSchemaUpdate = pedidoSchemaBase.extend({
  id_pedido: z.number().int().positive(),
}).refine((data) => data.direccionEntrega || data.direccion_entrega, {
  message: "Debe proporcionar una dirección de entrega",
  path: ["direccionEntrega"],
});

// Esquema para actualización parcial (solo campos editables por consumidor)
const pedidoSchemaUpdateParcial = z.object({
  direccion_entrega: z.string().min(5).optional(),
  direccionEntrega: z.string().min(5).optional(), // Alias para compatibilidad
  notas: z.string().nullable().optional(),
  metodo_pago: z.enum(["efectivo", "transferencia", "nequi", "daviplata", "pse", "tarjeta"]).optional(),
  estado: z.enum(["pendiente", "confirmado", "en_preparacion", "en_camino", "entregado", "cancelado"]).optional(),
  estado_pago: z.enum(["pendiente", "pagado", "reembolsado"]).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para actualizar",
});

export const getPedidos = async (ctx: Context) => {
  try {
    const objPedido = new PedidosModel();
    const lista = await objPedido.ListarPedidos();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Pedidos encontrados." : "No se encontraron pedidos.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getPedidos:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
      data: [],
    };
  }
};

// 📌 Obtener pedido por ID con detalles completos
export const getPedidoPorId = async (ctx: RouterContext<"/pedidos/:id">) => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "No autenticado.",
      };
      return;
    }

    // Validar que el parámetro sea un número válido (no una palabra como "recibidos")
    const idParam = ctx.params.id;
    if (!idParam || isNaN(Number(idParam)) || !/^\d+$/.test(idParam)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de pedido inválido.",
      };
      return;
    }

    const id_pedido = Number(idParam);
    if (id_pedido <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de pedido inválido.",
      };
      return;
    }

    const objPedido = new PedidosModel();
    
    // Obtener el pedido con información completa
    let pedido: PedidoDB | undefined = undefined;
    if (user.rol === 'productor') {
      const pedidos = await objPedido.ObtenerPedidosPorProductor(user.id) as PedidoDB[];
      pedido = pedidos.find((p: PedidoDB) => p.id_pedido === id_pedido);
    } else if (user.rol === 'consumidor') {
      const pedidos = await objPedido.ObtenerPedidosPorConsumidor(user.id) as PedidoDB[];
      pedido = pedidos.find((p: PedidoDB) => p.id_pedido === id_pedido);
    } else if (user.rol === 'admin') {
      const pedidos = await objPedido.ListarPedidos() as PedidoDB[];
      pedido = pedidos.find((p: PedidoDB) => p.id_pedido === id_pedido);
    }

    if (!pedido) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Pedido no encontrado o no tienes permisos para verlo.",
      };
      return;
    }

    // Obtener detalles del pedido
    const detalles = await objPedido.ObtenerDetallesPedido(id_pedido);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Pedido encontrado.",
      data: {
        ...pedido,
        detalles: detalles
      },
    };
  } catch (error) {
    console.error("Error en getPedidoPorId:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const postPedido = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "No autenticado.",
      };
      return;
    }

    const body = await ctx.request.body.json();
    const validated = pedidoSchema.parse(body);

    // ✅ Validar que solo consumidor pueda crear pedidos (o admin en nombre de otros)
    if (user.rol !== 'admin' && user.rol !== 'consumidor') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: "Solo los consumidores pueden crear pedidos.",
      };
      return;
    }

    // Si no es admin, el id_consumidor debe ser el del usuario autenticado
    if (user.rol !== 'admin' && validated.id_consumidor !== user.id) {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: "No puedes crear pedidos para otros usuarios.",
      };
      return;
    }

    const { direccionEntrega, direccion_entrega, fecha, fecha_entrega_estimada, productos, ...restValidated } = validated;
    const direccionFinal = direccion_entrega || direccionEntrega;
    
    // Validar que existe una dirección (aunque el schema ya lo valida, TypeScript necesita esta verificación)
    if (!direccionFinal) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Debe proporcionar una dirección de entrega.",
      };
      return;
    }
    
    // Si hay productos, calcular el total y crear pedido con detalles
    if (productos && productos.length > 0) {
      const total = productos.reduce((sum, p) => sum + (p.precio_unitario * p.cantidad), 0);
      
      await conexion.execute("START TRANSACTION");
      
      try {
        // Crear el pedido
        const pedidoResult = await conexion.execute(
          `INSERT INTO pedidos (id_consumidor, id_productor, total, estado, direccion_entrega, metodo_pago, estado_pago, notas, fecha_pedido) 
           VALUES (?, ?, ?, 'pendiente', ?, ?, 'pendiente', ?, NOW())`,
          [
            validated.id_consumidor,
            validated.id_productor,
            total,
            direccionFinal,
            validated.metodo_pago,
            validated.notas || null
          ]
        );

        const id_pedido = (pedidoResult as { insertId: number }).insertId;

        // Crear detalles del pedido y actualizar stock
        for (const producto of productos) {
          // Verificar stock disponible
          const [productoBD] = await conexion.query(
            "SELECT stock FROM productos WHERE id_producto = ?",
            [producto.id_producto]
          );
          
          if (!productoBD || productoBD.stock < producto.cantidad) {
            await conexion.execute("ROLLBACK");
            ctx.response.status = 400;
            ctx.response.body = {
              success: false,
              message: `No hay suficiente stock para el producto ID ${producto.id_producto}. Stock disponible: ${productoBD?.stock || 0}`,
            };
            return;
          }

          const subtotal = producto.precio_unitario * producto.cantidad;
          
          // Crear detalle del pedido
          await conexion.execute(
            `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal) 
             VALUES (?, ?, ?, ?, ?)`,
            [id_pedido, producto.id_producto, producto.cantidad, producto.precio_unitario, subtotal]
          );

          // Reducir stock
          await conexion.execute(
            "UPDATE productos SET stock = stock - ? WHERE id_producto = ?",
            [producto.cantidad, producto.id_producto]
          );
        }

        await conexion.execute("COMMIT");

        // Obtener el pedido creado
        const [pedidoCreado] = await conexion.query(
          "SELECT * FROM pedidos WHERE id_pedido = ?",
          [id_pedido]
        );

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Pedido creado exitosamente con productos.",
          data: pedidoCreado,
        };
        return;
      } catch (error) {
        await conexion.execute("ROLLBACK");
        throw error;
      }
    }

    // Si no hay productos, crear pedido simple (compatibilidad con código anterior)
    const pedidoData = {
      id_pedido: null,
      ...restValidated,
      total: restValidated.total ?? 0, // Asegurar que total sea number, no undefined
      estado: restValidated.estado ?? 'pendiente', // Asegurar que estado sea un valor válido, no undefined
      direccion_entrega: direccionFinal,
      fecha_pedido: fecha ? fecha.toISOString() : null,
      fecha_entrega: fecha_entrega_estimada ? fecha_entrega_estimada.toISOString() : null,
    };

    const objPedido = new PedidosModel(pedidoData);
    const result = await objPedido.AgregarPedido();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.pedido,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al crear el pedido.",
    };
  }
};

export const putPedido = async (ctx: RouterContext<"/pedidos/:id">) => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "No autenticado.",
      };
      return;
    }

    const id_pedido = Number(ctx.params.id);
    if (isNaN(id_pedido) || id_pedido <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de pedido inválido.",
      };
      return;
    }

    // ✅ Validar que el usuario tenga acceso al pedido
    const objPedido = new PedidosModel();
    const pedidos = await objPedido.ListarPedidos() as PedidoDB[];
    const pedido = pedidos.find((p: PedidoDB) => p.id_pedido === id_pedido);

    if (!pedido) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Pedido no encontrado.",
      };
      return;
    }

    // Validar permisos: admin puede todo, productor solo sus pedidos, consumidor solo sus pedidos
    if (user.rol !== 'admin') {
      if (user.rol === 'productor' && pedido.id_productor !== user.id) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "No tienes permisos para actualizar este pedido.",
        };
        return;
      }
      if (user.rol === 'consumidor' && pedido.id_consumidor !== user.id) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "No tienes permisos para actualizar este pedido.",
        };
        return;
      }
    }

    const body = await ctx.request.body.json();
    const bodyKeys = Object.keys(body);
    
    // Si solo se envía el estado, hacer actualización parcial
    if (bodyKeys.length === 1 && bodyKeys[0] === 'estado') {
      try {
        // Actualización solo de estado (más rápido y simple)
        const estadoValido = z.enum(["pendiente", "confirmado", "en_preparacion", "en_camino", "entregado", "cancelado"]).parse(body.estado);
        
        await conexion.execute(
          "UPDATE pedidos SET estado = ? WHERE id_pedido = ?",
          [estadoValido, id_pedido]
        );
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Estado del pedido actualizado exitosamente.",
        };
        return;
      } catch (error) {
        console.error("Error validando estado:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Estado inválido.",
        };
        return;
      }
    }
    
    // Si solo se envía el estado_pago, hacer actualización parcial
    if (bodyKeys.length === 1 && bodyKeys[0] === 'estado_pago') {
      try {
        // Actualización solo de estado de pago
        const estadoPagoValido = z.enum(["pendiente", "pagado", "reembolsado"]).parse(body.estado_pago);
        
        await conexion.execute(
          "UPDATE pedidos SET estado_pago = ? WHERE id_pedido = ?",
          [estadoPagoValido, id_pedido]
        );
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Estado de pago actualizado exitosamente.",
        };
        return;
      } catch (error) {
        console.error("Error validando estado de pago:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Estado de pago inválido.",
        };
        return;
      }
    }
    
    // Si se envían más campos, intentar actualización parcial primero
    try {
      const validatedParcial = pedidoSchemaUpdateParcial.parse(body);
      
      // Si es una actualización parcial, actualizar solo los campos proporcionados
      const camposActualizar: string[] = [];
      const valores: (string | number | null)[] = [];
      
      if (validatedParcial.direccion_entrega !== undefined) {
        camposActualizar.push('direccion_entrega = ?');
        valores.push(validatedParcial.direccion_entrega);
      } else if (validatedParcial.direccionEntrega !== undefined) {
        camposActualizar.push('direccion_entrega = ?');
        valores.push(validatedParcial.direccionEntrega);
      }
      
      if (validatedParcial.notas !== undefined) {
        camposActualizar.push('notas = ?');
        valores.push(validatedParcial.notas);
      }
      
      if (validatedParcial.metodo_pago !== undefined) {
        camposActualizar.push('metodo_pago = ?');
        valores.push(validatedParcial.metodo_pago);
      }
      
      if (validatedParcial.estado !== undefined) {
        camposActualizar.push('estado = ?');
        valores.push(validatedParcial.estado);
      }
      
      if (validatedParcial.estado_pago !== undefined) {
        camposActualizar.push('estado_pago = ?');
        valores.push(validatedParcial.estado_pago);
      }
      
      if (camposActualizar.length > 0) {
        valores.push(id_pedido);
        const query = `UPDATE pedidos SET ${camposActualizar.join(', ')} WHERE id_pedido = ?`;
        await conexion.execute(query, valores);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Pedido actualizado exitosamente.",
        };
        return;
      }
    } catch (error) {
      // Si falla la validación parcial, intentar actualización completa
      console.log("Actualización parcial falló, intentando actualización completa:", error);
    }
    
    // Si se envían más campos, hacer actualización completa
    const validated = pedidoSchemaUpdate.parse(body);

    const { direccionEntrega, fecha, fecha_entrega_estimada, ...restValidated } = validated;
    const _pedidoData = {
      ...restValidated,
      direccion_entrega: direccionEntrega, // Mapear direccionEntrega a direccion_entrega
      fecha_pedido: fecha ? fecha.toISOString() : null, // Mapear fecha a fecha_pedido
      fecha_entrega: fecha_entrega_estimada ? fecha_entrega_estimada.toISOString() : null, // Mapear fecha_entrega_estimada a fecha_entrega
    };

    const result = await objPedido.EditarPedido(id_pedido);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al actualizar el pedido.",
    };
  }
};

export const deletePedido = async (ctx: RouterContext<"/pedidos/:id">) => {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "No autenticado.",
      };
      return;
    }

    const id_pedido = Number(ctx.params.id);
    if (isNaN(id_pedido) || id_pedido <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de pedido inválido.",
      };
      return;
    }

    // ✅ Validar que el usuario tenga acceso al pedido
    const objPedido = new PedidosModel();
    const pedidos = await objPedido.ListarPedidos() as PedidoDB[];
    const pedido = pedidos.find((p: PedidoDB) => p.id_pedido === id_pedido);

    if (!pedido) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Pedido no encontrado.",
      };
      return;
    }

    // Validar permisos: admin puede eliminar todo, consumidor solo sus pedidos pendientes
    if (user.rol !== 'admin') {
      if (user.rol === 'consumidor' && pedido.id_consumidor !== user.id) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "No tienes permisos para eliminar este pedido.",
        };
        return;
      }
      // Solo permitir eliminar pedidos pendientes
      if (pedido.estado !== 'pendiente') {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          message: "Solo se pueden eliminar pedidos pendientes.",
        };
        return;
      }
    }

    const result = await objPedido.EliminarPedido(id_pedido);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Obtener mis pedidos (para productores y consumidores)
export const getMisPedidos = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "No autenticado.",
      };
      return;
    }

    const objPedido = new PedidosModel();
    let pedidos: PedidoDB[] = [];

    if (user.rol === 'productor') {
      // Obtener pedidos donde el usuario es el productor
      pedidos = await objPedido.ObtenerPedidosPorProductor(user.id) as PedidoDB[];
    } else if (user.rol === 'consumidor') {
      // Obtener pedidos donde el usuario es el consumidor
      pedidos = await objPedido.ObtenerPedidosPorConsumidor(user.id) as PedidoDB[];
    } else {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: "No tienes permisos para acceder a este recurso.",
      };
      return;
    }

    // Obtener detalles para cada pedido
    const pedidosConDetalles = await Promise.all(
      pedidos.map(async (pedido: PedidoDB) => {
        try {
          const detalles = await objPedido.ObtenerDetallesPedido(pedido.id_pedido);
          return {
            ...pedido,
            detalles: detalles
          };
        } catch (error) {
          console.warn(`Error obteniendo detalles del pedido ${pedido.id_pedido}:`, error);
          return {
            ...pedido,
            detalles: []
          };
        }
      })
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Pedidos encontrados.",
      data: pedidosConDetalles,
    };
  } catch (error) {
    console.error("Error en getMisPedidos:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Obtener pedidos recibidos (para productores)
// 📌 Obtener pedidos realizados (para consumidores)
export const getPedidosRealizados = async (ctx: Context) => {
  try {
    const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
    
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Usuario no autenticado.",
      };
      return;
    }

    // Verificar que el usuario es consumidor
    if (ctx.state.user?.rol !== 'consumidor' && ctx.state.user?.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: "Solo los consumidores pueden ver sus pedidos realizados.",
      };
      return;
    }

    const pedidos = await conexion.query(
      `SELECT 
        p.*,
        u.nombre as nombre_productor,
        u.email as email_productor,
        u.telefono as telefono_productor
      FROM pedidos p
      LEFT JOIN usuarios u ON p.id_productor = u.id_usuario
      WHERE p.id_consumidor = ?
      ORDER BY p.fecha_pedido DESC`,
      [userId]
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: pedidos.length > 0 ? "Pedidos encontrados." : "No se encontraron pedidos.",
      data: pedidos,
    };
  } catch (error) {
    console.error("Error en getPedidosRealizados:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
      data: [],
    };
  }
};

export const getPedidosRecibidos = async (ctx: Context) => {
  try {
    console.log(`📋 [GET /pedidos/recibidos] Ruta llamada correctamente`);
    const user = ctx.state.user;
    
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "No autenticado.",
      };
      return;
    }

    console.log(`📋 [GET /pedidos/recibidos] Usuario:`, { id: user.id, rol: user.rol });

    // Solo productores pueden ver pedidos recibidos
    if (user.rol !== 'productor' && user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: "Solo los productores pueden ver pedidos recibidos.",
      };
      return;
    }

    const objPedido = new PedidosModel();
    // Obtener pedidos donde el usuario es el productor
    const pedidos = await objPedido.ObtenerPedidosPorProductor(user.id) as PedidoDB[];

    // Obtener detalles para cada pedido
    const pedidosConDetalles = await Promise.all(
      pedidos.map(async (pedido: PedidoDB) => {
        try {
          const detalles = await objPedido.ObtenerDetallesPedido(pedido.id_pedido);
          return {
            ...pedido,
            detalles: detalles
          };
        } catch (error) {
          console.warn(`Error obteniendo detalles del pedido ${pedido.id_pedido}:`, error);
          return {
            ...pedido,
            detalles: []
          };
        }
      })
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Pedidos recibidos encontrados.",
      data: pedidosConDetalles,
    };
  } catch (error) {
    console.error("Error en getPedidosRecibidos:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};