import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { cartService } from "../Services/CartService.ts";
import { notificationService } from "../Services/NotificationService.ts";
import { emailService } from "../Services/EmailService.ts";

// Esquemas de validación
const addToCartSchema = z.object({
  id_producto: z.number().int().positive(),
  cantidad: z.number().int().positive().max(100)
});

const updateCartItemSchema = z.object({
  cantidad: z.number().int().positive().max(100)
});

const checkoutSchema = z.object({
  direccionEntrega: z.string().min(1).max(500), // Reducido mínimo a 1 para permitir direcciones cortas
  notas: z.string().max(1000).optional(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'nequi', 'daviplata', 'pse']),
  cupon_codigo: z.string().optional(),
  id_ciudad_entrega: z.number().int().positive().optional()
});

export class CartController {
  /**
   * Obtener carrito del usuario
   */
  static async getCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const cart = await cartService.getUserCart(user.id);

      if (!cart) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Carrito vacío",
          data: {
            items: [],
            total_items: 0,
            total_precio: 0,
            fecha_actualizacion: new Date()
          }
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Carrito obtenido correctamente",
        data: cart
      };
    } catch (error) {
      console.error("Error al obtener carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener el carrito"
      };
    }
  }

  /**
   * Agregar producto al carrito
   */
  static async addToCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const validated = addToCartSchema.parse(body);

      const result = await cartService.addToCart(
        user.id,
        validated.id_producto,
        validated.cantidad
      );

      if (result.success) {
        // Obtener el carrito actualizado
        const cart = await cartService.getUserCart(user.id);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: cart
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al agregar al carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      
      if (error instanceof z.ZodError) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos inválidos",
          message: "Los datos proporcionados no son válidos",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }

      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al agregar producto al carrito"
      };
    }
  }

  /**
   * Actualizar cantidad de producto en el carrito
   */
  static async updateCartItem(ctx: RouterContext<"/cart/item/:id">) {
    try {
      const user = ctx.state.user;
      const id_producto = Number(ctx.params.id);
      const body = await ctx.request.body.json();
      const validated = updateCartItemSchema.parse(body);

      if (isNaN(id_producto) || id_producto <= 0) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "ID de producto inválido",
          message: "El ID del producto no es válido"
        };
        return;
      }

      const result = await cartService.updateCartItem(
        user.id,
        id_producto,
        validated.cantidad
      );

      if (result.success) {
        const cart = await cartService.getUserCart(user.id);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: cart
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al actualizar carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al actualizar item del carrito:", error);
      
      if (error instanceof z.ZodError) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos inválidos",
          message: "Los datos proporcionados no son válidos",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }

      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al actualizar el carrito"
      };
    }
  }

  /**
   * Eliminar producto del carrito
   */
  static async removeFromCart(ctx: RouterContext<"/cart/item/:id">) {
    try {
      const user = ctx.state.user;
      const id_producto = Number(ctx.params.id);

      if (isNaN(id_producto) || id_producto <= 0) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "ID de producto inválido",
          message: "El ID del producto no es válido"
        };
        return;
      }

      const result = await cartService.removeFromCart(user.id, id_producto);

      if (result.success) {
        const cart = await cartService.getUserCart(user.id);
        
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: cart
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al eliminar del carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al eliminar del carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al eliminar producto del carrito"
      };
    }
  }

  /**
   * Vaciar carrito
   */
  static async clearCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const result = await cartService.clearCart(user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: result.message,
          data: {
            items: [],
            total_items: 0,
            total_precio: 0,
            fecha_actualizacion: new Date()
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al vaciar carrito",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error al vaciar carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al vaciar el carrito"
      };
    }
  }

  /**
   * Validar carrito antes del checkout
   */
  static async validateCart(ctx: Context) {
    try {
      const user = ctx.state.user;
      const validation = await cartService.validateCart(user.id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: validation.valid ? "Carrito válido" : "Carrito inválido",
        data: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          items_validated: validation.items_validated,
          total_items: validation.items_validated.length,
          total_precio: validation.items_validated.reduce((sum, item) => sum + item.precio_total, 0)
        }
      };
    } catch (error) {
      console.error("Error al validar carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al validar el carrito"
      };
    }
  }

  /**
   * Procesar checkout (convertir carrito en pedido)
   */
  static async checkout(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const validated = checkoutSchema.parse(body);

      // Validar carrito primero
      const validation = await cartService.validateCart(user.id);
      
      if (!validation.valid) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Carrito inválido",
          message: "El carrito contiene errores que deben ser corregidos",
          details: {
            errors: validation.errors,
            warnings: validation.warnings
          }
        };
        return;
      }

      // Procesar checkout
      const result = await cartService.convertCartToOrder(
        user.id,
        validated.direccionEntrega,
        validated.notas || '',
        validated.metodo_pago
      );

      if (result.success) {
        // Obtener información del pedido
        const { conexion } = await import("../Models/Conexion.ts");
        const pedido = await conexion.query(
          `SELECT p.*, u.nombre as nombre_productor, u.email as email_productor
           FROM pedidos p
           INNER JOIN usuarios u ON p.id_productor = u.id_usuario
           WHERE p.id_pedido = ?`,
          [result.pedido_id]
        );

        const productos = await conexion.query(
          `SELECT dp.*, pr.nombre, pr.unidad_medida
           FROM detalle_pedidos dp
           INNER JOIN productos pr ON dp.id_producto = pr.id_producto
           WHERE dp.id_pedido = ?`,
          [result.pedido_id]
        );

        const totalPrecio = validation.items_validated.reduce((sum, item) => sum + item.precio_total, 0);

        let pagoResponse = null;

        if (validated.metodo_pago !== 'efectivo') {
          const { PaymentService } = await import("../Services/PaymentService.ts");
          
          pagoResponse = await PaymentService.crearPago({
            id_pedido: result.pedido_id!,
            id_usuario: user.id,
            monto: totalPrecio,
            metodo_pago: validated.metodo_pago as any,
            pasarela: 'stripe'
          });
        } else {
          await conexion.execute(
            `UPDATE pedidos SET estado_pago = 'pendiente' WHERE id_pedido = ?`,
            [result.pedido_id!]
          );
        }

        const requiereStripe = validated.metodo_pago !== 'efectivo';

        if (pedido.length > 0 && !requiereStripe) {
          try {
            const totalFormateado = totalPrecio.toLocaleString();
            const idProductor = pedido[0].id_productor;
            
            console.log("[Checkout] Notificando al productor (efectivo):", {
              id_productor: idProductor,
              id_pedido: result.pedido_id,
              cantidad_productos: productos.length,
              total: totalFormateado
            });

            if (!idProductor) {
              console.error("[Checkout] ❌ No se encontró id_productor en el pedido");
            } else {
              const resultNotif = await notificationService.createNotification({
                id_usuario: idProductor,
                titulo: "🛒 Nuevo Pedido Recibido",
                mensaje: `¡Tienes un nuevo pedido #${result.pedido_id}! El cliente ha realizado un pedido por un total de $${totalFormateado}. El pedido incluye ${productos.length} producto${productos.length !== 1 ? 's' : ''}. El pago será en efectivo y deberás confirmarlo cuando lo recibas.`,
                tipo: 'info',
                datos_extra: {
                  pedido_id: result.pedido_id,
                  productos: productos,
                  action: 'view_order'
                }
              });
            }
          } catch (notifError) {
            console.error("[Checkout] Error notificando al productor (efectivo):", notifError);
          }
        }

        if (!requiereStripe) {
          await notificationService.createNotification({
            id_usuario: user.id,
            titulo: "🛒 Pedido Completado",
            mensaje: `Tu pedido #${result.pedido_id} ha sido creado exitosamente. El pago está pendiente ya que seleccionaste pago en efectivo. El productor confirmará el pago cuando lo reciba.`,
            tipo: 'info',
            datos_extra: {
              pedido_id: result.pedido_id,
              action: 'view_order'
            }
          });
        } else if (pagoResponse && pagoResponse.estado_pago === 'pagado') {
          await notificationService.createNotification({
            id_usuario: user.id,
            titulo: "🛒 Pedido Realizado",
            mensaje: `Tu pedido #${result.pedido_id} ha sido procesado exitosamente`,
            tipo: 'success',
            datos_extra: {
              pedido_id: result.pedido_id,
              action: 'view_order'
            }
          });
        }

        const pagoData = requiereStripe && pagoResponse && pagoResponse.success && pagoResponse.datos_adicionales?.client_secret ? {
          id_pago: pagoResponse.id_pago,
          estado_pago: pagoResponse.estado_pago,
          referencia_pago: pagoResponse.referencia_pago,
          client_secret: pagoResponse.datos_adicionales.client_secret,
          payment_intent_id: pagoResponse.datos_adicionales.payment_intent_id
        } : requiereStripe && pagoResponse && !pagoResponse.success ? {
          error: pagoResponse.error || 'Error desconocido al crear el pago',
          estado_pago: 'pendiente'
        } : null;

        ctx.response.status = 201;
        ctx.response.body = {
          success: true,
          message: requiereStripe
            ? "Pedido creado exitosamente. Completa el pago para finalizar."
            : "Pedido creado exitosamente. El carrito ha sido vaciado.",
          data: {
            pedido_id: result.pedido_id,
            total_precio: totalPrecio,
            metodo_pago: validated.metodo_pago,
            pago: pagoData
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al procesar pedido",
          message: result.message
        };
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      
      if (error instanceof z.ZodError) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos inválidos",
          message: "Los datos proporcionados no son válidos",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }

      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al procesar el pedido"
      };
    }
  }

  /**
   * Obtener estadísticas del carrito
   */
  static async getCartStats(ctx: Context) {
    try {
      const user = ctx.state.user;
      const cart = await cartService.getUserCart(user.id);

      if (!cart) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Sin estadísticas de carrito",
          data: {
            total_items: 0,
            total_precio: 0,
            productos_unicos: 0,
            fecha_actualizacion: null
          }
        };
        return;
      }

      const productosUnicos = cart.items.length;
      const productosDisponibles = cart.items.filter(item => item.disponible).length;
      const productosSinStock = cart.items.filter(item => !item.disponible).length;

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Estadísticas del carrito obtenidas",
        data: {
          total_items: cart.total_items,
          total_precio: cart.total_precio,
          productos_unicos: productosUnicos,
          productos_disponibles: productosDisponibles,
          productos_sin_stock: productosSinStock,
          fecha_actualizacion: cart.fecha_actualizacion,
          porcentaje_disponibilidad: productosUnicos > 0 ? (productosDisponibles / productosUnicos) * 100 : 0
        }
      };
    } catch (error) {
      console.error("Error al obtener estadísticas del carrito:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al obtener estadísticas del carrito"
      };
    }
  }
}
