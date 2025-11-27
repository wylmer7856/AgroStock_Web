// 💳 CONTROLADOR DE PAGOS

import { Context, RouterContext } from "../Dependencies/dependencias.ts";
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
      const pago = await PaymentService.obtenerPago(parseInt(id));

      if (!pago) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Pago no encontrado"
        };
        return;
      }

      // Verificar que el usuario tenga acceso (es su pago o es admin)
      if (pago.id_usuario !== user.id && user.rol !== 'admin') {
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
        data: pago
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

  /**
   * Webhook de confirmación de PayU
   */
  static async payuConfirmacion(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { referenceCode, transactionState, value, currency, signature } = body;

      // Validar firma
      // @ts-ignore
      const apiKey = Deno.env.get("PAYU_API_KEY") || "";
      // @ts-ignore
      const merchantId = Deno.env.get("PAYU_MERCHANT_ID") || "";
      const expectedSignature = this.generarFirmaPayU(referenceCode, Number(value), currency);

      if (signature !== expectedSignature) {
        console.error("Firma de PayU inválida");
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "Firma inválida" };
        return;
      }

      // Buscar pago por referencia
      const { PaymentService } = await import("../Services/PaymentService.ts");
      const { conexion } = await import("../Models/Conexion.ts");
      
      const [pago] = await conexion.query(
        `SELECT * FROM pagos WHERE referencia_pago = ?`,
        [referenceCode]
      ) as Array<Record<string, unknown>>;

      if (!pago) {
        ctx.response.status = 404;
        ctx.response.body = { success: false, error: "Pago no encontrado" };
        return;
      }

      // Actualizar estado según respuesta de PayU
      const estado_pago = transactionState === '4' ? 'aprobado' : 
                         transactionState === '6' ? 'rechazado' : 
                         transactionState === '7' ? 'pendiente' : 'procesando';

      await PaymentService.actualizarEstadoPago(
        Number(pago.id_pago),
        estado_pago,
        `Confirmación PayU: ${transactionState}`
      );

      // Guardar respuesta completa
      await conexion.execute(
        `UPDATE pagos SET respuesta_pasarela = ? WHERE id_pago = ?`,
        [JSON.stringify(body), pago.id_pago]
      );

      ctx.response.status = 200;
      ctx.response.body = { success: true, message: "Confirmación recibida" };
    } catch (error) {
      console.error("Error procesando confirmación PayU:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno" };
    }
  }

  /**
   * Webhook de respuesta de PayU (cuando el usuario regresa)
   */
  static async payuRespuesta(ctx: Context) {
    try {
      const params = ctx.request.url.searchParams;
      const referenceCode = params.get('referenceCode');
      const transactionState = params.get('transactionState');
      const value = params.get('value');
      const currency = params.get('currency') || 'COP';
      const signature = params.get('signature');

      if (!referenceCode) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "Parámetros inválidos" };
        return;
      }

      // Buscar pago
      const { conexion } = await import("../Models/Conexion.ts");
      const [pago] = await conexion.query(
        `SELECT * FROM pagos WHERE referencia_pago = ?`,
        [referenceCode]
      ) as Array<Record<string, unknown>>;

      if (!pago) {
        ctx.response.status = 404;
        ctx.response.body = { success: false, error: "Pago no encontrado" };
        return;
      }

      // Redirigir al frontend con el resultado
      // @ts-ignore
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:3000";
      const estado = transactionState === '4' ? 'aprobado' : 
                    transactionState === '6' ? 'rechazado' : 'pendiente';

      const redirectUrl = `${frontendUrl}/consumidor/pedidos/${pago.id_pedido}?pago=${estado}&ref=${referenceCode}`;
      
      ctx.response.redirect(redirectUrl);
    } catch (error) {
      console.error("Error procesando respuesta PayU:", error);
      // @ts-ignore
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:3000";
      ctx.response.redirect(`${frontendUrl}/consumidor/pedidos?error=pago`);
    }
  }

  /**
   * Generar firma PayU (helper)
   */
  private static generarFirmaPayU(referenceCode: string, amount: number, currency: string): string {
    // @ts-ignore
    const apiKey = Deno.env.get("PAYU_API_KEY") || "";
    // @ts-ignore
    const merchantId = Deno.env.get("PAYU_MERCHANT_ID") || "";
    const cadena = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    
    if (!apiKey) {
      return 'test_signature_' + Date.now();
    }

    // Implementación simple de hash (en producción usar MD5 real)
    let hash = 0;
    for (let i = 0; i < cadena.length; i++) {
      const char = cadena.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
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






