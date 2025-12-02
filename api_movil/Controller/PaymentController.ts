// 💳 CONTROLADOR DE PAGOS

import { Context, RouterContext, load } from "../Dependencies/dependencias.ts";
import { PaymentService, type PaymentData } from "../Services/PaymentService.ts";
import { AuditoriaService } from "../Services/AuditoriaService.ts";

export class PaymentController {
  
  /**
   * Crear pago
   */
  static async crearPago(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado",
          message: "Debes estar autenticado"
        };
        return;
      }

      const body = await ctx.request.body.json();
      const paymentData: PaymentData = {
        id_pedido: Number(body.id_pedido),
        id_usuario: user.id,
        monto: Number(body.monto),
        metodo_pago: (body.metodo_pago || 'efectivo') as PaymentData['metodo_pago'],
        pasarela: body.pasarela as PaymentData['pasarela'],
        datos_tarjeta: body.datos_tarjeta as PaymentData['datos_tarjeta'],
        datos_adicionales: body.datos_adicionales as PaymentData['datos_adicionales']
      };

      const result = await PaymentService.crearPago(paymentData, ctx);

      // Registrar en auditoría
      await AuditoriaService.registrarAccion({
        id_usuario: user.id,
        accion: 'crear_pago',
        tabla_afectada: 'pagos',
        id_registro_afectado: result.id_pago,
        datos_despues: paymentData as unknown as Record<string, unknown>,
        resultado: result.success ? 'exitoso' : 'fallido',
        error_message: result.error
      }, ctx);

      ctx.response.status = result.success ? 201 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error creando pago:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al crear pago"
      };
    }
  }

  /**
   * Obtener información de un pago
   */
  static async obtenerPago(ctx: RouterContext<"/pagos/:id">) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado"
        };
        return;
      }

      const { id } = ctx.params;
      const pedido = await PaymentService.obtenerPago(parseInt(id));

      if (!pedido) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Pedido no encontrado"
        };
        return;
      }

      if (Number(pedido.id_consumidor) !== user.id && user.rol !== 'admin') {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "No autorizado"
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: pedido
      };
    } catch (error) {
      console.error("Error obteniendo pago:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }

  /**
   * Obtener pagos de un pedido
   */
  static async obtenerPagosPorPedido(ctx: RouterContext<"/pagos/pedido/:id_pedido">) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado"
        };
        return;
      }

      const { id_pedido } = ctx.params;
      const pagos = await PaymentService.obtenerPagosPorPedido(parseInt(id_pedido));

      // ✅ Validar acceso: admin ve todo, consumidor/productor solo sus pedidos
      if (user.rol !== 'admin' && pagos.length > 0) {
        // Verificar que el pedido pertenezca al usuario
        const { PedidosModel } = await import("../Models/PedidosModel.ts");
        const pedidosModel = new PedidosModel();
        const pedidos = await pedidosModel.ListarPedidos();
        const pedido = pedidos.find((p: any) => p.id_pedido === parseInt(id_pedido));
        
        if (pedido) {
          if (user.rol === 'consumidor' && pedido.id_consumidor !== user.id) {
            ctx.response.status = 403;
            ctx.response.body = {
              success: false,
              error: "No autorizado"
            };
            return;
          }
          if (user.rol === 'productor' && pedido.id_productor !== user.id) {
            ctx.response.status = 403;
            ctx.response.body = {
              success: false,
              error: "No autorizado"
            };
            return;
          }
        }
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: pagos,
        total: pagos.length
      };
    } catch (error) {
      console.error("Error obteniendo pagos:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }

  static async crearStripePaymentIntent(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado",
          message: "Debes estar autenticado"
        };
        return;
      }

      const body = await ctx.request.body.json();
      const { id_pedido, monto } = body;

      if (!id_pedido || !monto) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos incompletos",
          message: "Se requiere id_pedido y monto"
        };
        return;
      }

      const paymentData: PaymentData = {
        id_pedido: Number(id_pedido),
        id_usuario: user.id,
        monto: Number(monto),
        metodo_pago: 'tarjeta',
        pasarela: 'stripe'
      };

      const result = await PaymentService.crearPago(paymentData, ctx);

      if (result.success && result.datos_adicionales) {
        ctx.response.status = 201;
        ctx.response.body = {
          success: true,
          client_secret: result.datos_adicionales.client_secret,
          payment_intent_id: result.datos_adicionales.payment_intent_id,
          id_pago: result.id_pago,
          referencia_pago: result.referencia_pago
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error creando Payment Intent de Stripe:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor",
        message: "Error al crear sesión de pago"
      };
    }
  }

  static async stripeWebhook(ctx: Context) {
    try {
      const env = await load();
      const webhookSecret = env.STRIPE_WEBHOOK_SECRET || "";
      const signature = ctx.request.headers.get("stripe-signature");

      if (!signature) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "Falta firma de Stripe" };
        return;
      }

      const body = await ctx.request.body.text();
      
      let event: any;
      try {
        event = JSON.parse(body);
      } catch {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "Body inválido" };
        return;
      }

      console.log("[Stripe Webhook] Evento recibido:", event.type);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as { id: string; metadata?: { pedido_id?: string } };
        const id_pedido = paymentIntent.metadata?.pedido_id ? parseInt(paymentIntent.metadata.pedido_id) : undefined;
        await PaymentService.confirmarPagoStripe(paymentIntent.id, 'succeeded', id_pedido);
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as { id: string; metadata?: { pedido_id?: string } };
        const id_pedido = paymentIntent.metadata?.pedido_id ? parseInt(paymentIntent.metadata.pedido_id) : undefined;
        await PaymentService.confirmarPagoStripe(paymentIntent.id, 'failed', id_pedido);
      } else if (event.type === 'payment_intent.canceled') {
        const paymentIntent = event.data.object as { id: string; metadata?: { pedido_id?: string } };
        const id_pedido = paymentIntent.metadata?.pedido_id ? parseInt(paymentIntent.metadata.pedido_id) : undefined;
        await PaymentService.confirmarPagoStripe(paymentIntent.id, 'canceled', id_pedido);
      }

      ctx.response.status = 200;
      ctx.response.body = { success: true, received: true };
    } catch (error) {
      console.error("Error procesando webhook de Stripe:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error procesando webhook"
      };
    }
  }

  static async confirmarPagoStripe(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autenticado"
        };
        return;
      }

      const body = await ctx.request.body.json();
      const { payment_intent_id, estado, id_pedido } = body;

      if (!payment_intent_id || !estado) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Datos incompletos"
        };
        return;
      }

      const success = await PaymentService.confirmarPagoStripe(
        payment_intent_id,
        estado as 'succeeded' | 'failed' | 'canceled',
        id_pedido ? Number(id_pedido) : undefined
      );

      if (success) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Pago confirmado correctamente"
        };
      } else {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "No se encontró el pago"
        };
      }
    } catch (error) {
      console.error("Error confirmando pago de Stripe:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }

  /**
   * Actualizar estado de pago (solo admin o webhook)
   */
  static async actualizarEstadoPago(ctx: Context) {
    try {
      const user = ctx.state.user;
      const body = await ctx.request.body.json();
      const { id, estado, motivo } = body;

      // Verificar si es webhook (tiene secret) o admin
      const webhookSecret = ctx.request.headers.get('X-Webhook-Secret');
      // @ts-ignore - Deno is a global object in Deno runtime
      const isWebhook = webhookSecret === Deno.env.get("WEBHOOK_SECRET");

      if (!user && !isWebhook) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "No autorizado"
        };
        return;
      }

      if (user && user.rol !== 'admin' && !isWebhook) {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "Solo administradores pueden actualizar estados"
        };
        return;
      }

      await PaymentService.actualizarEstadoPago(parseInt(id), estado, motivo);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Estado de pago actualizado"
      };
    } catch (error) {
      console.error("Error actualizando estado:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "Error interno del servidor"
      };
    }
  }
}






