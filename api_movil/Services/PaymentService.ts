// ðŸ’³ SERVICIO DE PAGOS - INTEGRACIÃ“N CON PASARELAS DE PAGO

import { conexion } from "../Models/Conexion.ts";
import { AuditoriaService } from "./AuditoriaService.ts";
import type { Context } from "../Dependencies/dependencias.ts";

export interface PaymentData {
  id_pedido: number;
  id_usuario: number;
  monto: number;
  metodo_pago: 'tarjeta' | 'nequi' | 'daviplata' | 'pse' | 'efectivo' | 'transferencia';
  pasarela?: 'wompi' | 'payu' | 'mercadopago' | 'stripe';
  datos_tarjeta?: {
    numero?: string;
    cvv?: string;
    fecha_expiracion?: string;
    nombre_titular?: string;
  };
  datos_adicionales?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  id_pago?: number;
  referencia_pago?: string;
  estado_pago?: string;
  url_pago?: string;
  mensaje?: string;
  error?: string;
}

export class PaymentService {
  // @ts-ignore - Deno is a global object in Deno runtime
  private static readonly WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY") || "";
  // @ts-ignore - Deno is a global object in Deno runtime
  private static readonly WOMPI_PRIVATE_KEY = Deno.env.get("WOMPI_PRIVATE_KEY") || "";
  // @ts-ignore - Deno is a global object in Deno runtime
  private static readonly PAYU_API_KEY = Deno.env.get("PAYU_API_KEY") || "";
  // @ts-ignore - Deno is a global object in Deno runtime
  private static readonly PAYU_MERCHANT_ID = Deno.env.get("PAYU_MERCHANT_ID") || "";

  /**
   * Crear pago
   */
  static async crearPago(
    data: PaymentData,
    _ctx?: Context
  ): Promise<PaymentResponse> {
    try {
      // Validar monto
      if (data.monto <= 0) {
        return {
          success: false,
          error: "El monto debe ser mayor a 0"
        };
      }

      // Crear registro de pago (MySQL syntax)
      const result = await conexion.execute(
        `INSERT INTO pagos 
         (id_pedido, id_usuario, monto, moneda, metodo_pago, pasarela_pago, estado_pago)
         VALUES (?, ?, ?, 'COP', ?, ?, 'pendiente')`,
        [
          data.id_pedido,
          data.id_usuario,
          data.monto,
          data.metodo_pago,
          data.pasarela || 'manual'
        ]
      );

      // Obtener el ID del pago insertado (MySQL)
      const id_pago = (result as { insertId: number }).insertId;

      // Procesar segÃºn mÃ©todo de pago
      if (data.metodo_pago === 'efectivo') {
        // Pago en efectivo - se marca como aprobado manualmente despuÃ©s
        await this.actualizarEstadoPago(id_pago, 'pendiente', 'Pago en efectivo pendiente de confirmaciÃ³n');
        
        return {
          success: true,
          id_pago,
          estado_pago: 'pendiente',
          mensaje: "Pago en efectivo registrado. Se confirmarÃ¡ cuando se reciba el pago."
        };
      }

      // Procesar con pasarela de pago
      if (data.pasarela === 'wompi') {
        return await this.procesarConWompi(id_pago, data);
      } else if (data.pasarela === 'payu') {
        return await this.procesarConPayU(id_pago, data);
      } else {
        return {
          success: false,
          error: "Pasarela de pago no especificada o no soportada"
        };
      }
    } catch (error) {
      console.error("Error creando pago:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear pago"
      };
    }
  }

  /**
   * Procesar pago con Wompi (Colombia)
   */
  private static async procesarConWompi(
    id_pago: number,
    _data: PaymentData
  ): Promise<PaymentResponse> {
    try {
      // Actualizar estado a procesando
      await this.actualizarEstadoPago(id_pago, 'procesando', 'Procesando con Wompi');

      // AquÃ­ irÃ­a la integraciÃ³n real con Wompi API
      // Por ahora, simulamos la respuesta
      const referencia_pago = `WOMPI_${Date.now()}_${id_pago}`;

      // En producciÃ³n, aquÃ­ harÃ­as:
      /*
      const wompiResponse = await fetch('https://production.wompi.co/v1/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.WOMPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_in_cents: data.monto * 100,
          currency: 'COP',
          customer_email: customerEmail,
          payment_method: {
            type: 'CARD',
            token: data.datos_tarjeta?.token
          },
          reference: referencia_pago
        })
      });
      */

      // SimulaciÃ³n - en producciÃ³n usar respuesta real
      const estado_pago = 'aprobado'; // o 'rechazado' segÃºn respuesta

      await conexion.execute(
        `UPDATE pagos 
         SET referencia_pago = ?, 
             estado_pago = ?,
             fecha_procesamiento = CASE WHEN ? = 'procesando' THEN NOW() ELSE fecha_procesamiento END,
             fecha_aprobacion = CASE WHEN ? = 'aprobado' THEN NOW() ELSE fecha_aprobacion END,
             respuesta_pasarela = ?
         WHERE id_pago = ?`,
        [
          referencia_pago,
          estado_pago,
          estado_pago,
          estado_pago,
          JSON.stringify({ simulacion: true }), // En producciÃ³n: respuesta real
          id_pago
        ]
      );

      // Actualizar estado del pedido
      await this.sincronizarEstadoPedido(id_pago);

      return {
        success: estado_pago === 'aprobado',
        id_pago,
        referencia_pago,
        estado_pago,
        mensaje: estado_pago === 'aprobado' 
          ? "Pago procesado exitosamente" 
          : "Pago rechazado"
      };
    } catch (error) {
      await this.actualizarEstadoPago(id_pago, 'rechazado', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: "Error procesando pago con Wompi"
      };
    }
  }

  /**
   * Procesar pago con PayU (Colombia) - MODO SANDBOX PARA PRUEBAS
   */
  private static async procesarConPayU(
    id_pago: number,
    data: PaymentData
  ): Promise<PaymentResponse> {
    try {
      await this.actualizarEstadoPago(id_pago, 'procesando', 'Procesando con PayU (Sandbox)');

      const referencia_pago = `PAYU_${Date.now()}_${id_pago}`;
      
      // URL del sandbox de PayU para pruebas
      const PAYU_SANDBOX_URL = "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi";
      const PAYU_PRODUCTION_URL = "https://api.payulatam.com/payments-api/4.0/service.cgi";
      
      // Usar sandbox si no hay credenciales configuradas o si estÃ¡ en modo desarrollo
      const useSandbox = !this.PAYU_API_KEY || !this.PAYU_MERCHANT_ID || 
                         Deno.env.get("PAYU_ENVIRONMENT") === "sandbox";
      const _payuUrl = useSandbox ? PAYU_SANDBOX_URL : PAYU_PRODUCTION_URL;

      // Si estÃ¡ en modo sandbox o no hay credenciales, simular el pago
      if (useSandbox || !this.PAYU_API_KEY) {
        console.log("ðŸ§ª Modo Sandbox PayU - Simulando pago");
        
        // Simular respuesta exitosa para pruebas
        const estado_pago = 'aprobado'; // En sandbox siempre aprobamos para pruebas
        
        await conexion.execute(
          `UPDATE pagos 
           SET referencia_pago = ?, 
               estado_pago = ?,
               fecha_procesamiento = NOW(),
               fecha_aprobacion = NOW(),
               respuesta_pasarela = ?
           WHERE id_pago = ?`,
          [
            referencia_pago,
            estado_pago,
            JSON.stringify({ 
              simulacion: true,
              sandbox: true,
              referencia: referencia_pago,
              monto: data.monto,
              mensaje: "Pago simulado en modo sandbox - No se realizÃ³ cargo real"
            }),
            id_pago
          ]
        );

        await this.sincronizarEstadoPedido(id_pago);

        return {
          success: true,
          id_pago,
          referencia_pago,
          estado_pago: 'aprobado',
          mensaje: "Pago procesado exitosamente (Modo Sandbox - No se realizÃ³ cargo real)"
        };
      }

      // CÃ³digo para producciÃ³n (comentado para pruebas)
      // Por ahora, si no es sandbox, también simulamos el pago
      let estado_pago: 'aprobado' | 'rechazado' = 'rechazado';
      
      /*
      const payuResponse = await fetch(_payuUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.PAYU_API_KEY + ':' + this.PAYU_MERCHANT_ID)}`
        },
        body: JSON.stringify({
          language: 'es',
          command: 'SUBMIT_TRANSACTION',
          merchant: {
            apiKey: this.PAYU_API_KEY,
            apiLogin: this.PAYU_MERCHANT_ID
          },
          transaction: {
            order: {
              accountId: this.PAYU_MERCHANT_ID,
              referenceCode: referencia_pago,
              description: 'Pago AgroStock',
              value: data.monto,
              currency: 'COP'
            },
            payer: {
              email: customerEmail
            },
            paymentMethod: data.metodo_pago
          }
        })
      });

      const payuResult = await payuResponse.json();
      estado_pago = payuResult.code === 'SUCCESS' ? 'aprobado' : 'rechazado';
      */

      // Por ahora, en producción también simulamos (cambiar cuando se active PayU real)
      if (!useSandbox && this.PAYU_API_KEY) {
        console.log("⚠️ Modo Producción PayU - Simulando pago (código de producción comentado)");
        estado_pago = 'aprobado'; // Simular aprobado en producción también
      }

      await conexion.execute(
        `UPDATE pagos 
         SET referencia_pago = ?, 
             estado_pago = ?,
             fecha_procesamiento = CASE WHEN ? = 'procesando' THEN NOW() ELSE fecha_procesamiento END,
             fecha_aprobacion = CASE WHEN ? = 'aprobado' THEN NOW() ELSE fecha_aprobacion END,
             respuesta_pasarela = ?
         WHERE id_pago = ?`,
        [
          referencia_pago,
          estado_pago,
          estado_pago,
          estado_pago,
          JSON.stringify({ simulacion: true }),
          id_pago
        ]
      );

      await this.sincronizarEstadoPedido(id_pago);

      return {
        success: estado_pago === 'aprobado',
        id_pago,
        referencia_pago,
        estado_pago,
        mensaje: estado_pago === 'aprobado' 
          ? "Pago procesado exitosamente" 
          : "Pago rechazado"
      };
    } catch (error) {
      await this.actualizarEstadoPago(id_pago, 'rechazado', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: "Error procesando pago con PayU"
      };
    }
  }

  /**
   * Sincronizar estado de pago con pedido
   */
  static async sincronizarEstadoPedido(id_pago: number): Promise<void> {
    try {
      const [pago] = await conexion.query(
        `SELECT id_pedido, estado_pago FROM pagos WHERE id_pago = ?`,
        [id_pago]
      );

      if (!pago) return;

      const nuevoEstadoPedido = pago.estado_pago === 'aprobado' ? 'confirmado' : 
                                pago.estado_pago === 'rechazado' ? 'pendiente' : null;

      if (nuevoEstadoPedido) {
        // Actualizar estado del pedido y estado_pago (sin id_pago ni fecha_pago que no existen en la tabla)
        await conexion.execute(
          `UPDATE pedidos 
           SET estado = ?, 
               estado_pago = ?
           WHERE id_pedido = ?`,
          [
            nuevoEstadoPedido,
            pago.estado_pago === 'aprobado' ? 'pagado' : 
            pago.estado_pago === 'rechazado' ? 'pendiente' : 'pendiente',
            pago.id_pedido
          ]
        );

        // Registrar en bitÃ¡cora
        await AuditoriaService.registrarCambio(
          'pedidos',
          pago.id_pedido,
          'actualizar',
          0, // Sistema
          {
            cambios_completos: {
              estado_pago: pago.estado_pago,
              estado_pedido: nuevoEstadoPedido
            }
          },
          undefined,
          'SincronizaciÃ³n automÃ¡tica con estado de pago'
        );
      }
    } catch (error) {
      console.error("Error sincronizando estado de pago:", error);
    }
  }

  /**
   * Actualizar estado de pago
   */
  static async actualizarEstadoPago(
    id_pago: number,
    estado: string,
    motivo?: string
  ): Promise<void> {
    try {
      await conexion.execute(
        `UPDATE pagos 
         SET estado_pago = ?,
             motivo_rechazo = ?,
             fecha_procesamiento = CASE WHEN ? = 'procesando' THEN NOW() ELSE fecha_procesamiento END,
             fecha_aprobacion = CASE WHEN ? = 'aprobado' THEN NOW() ELSE fecha_aprobacion END
         WHERE id_pago = ?`,
        [estado, motivo || null, estado, estado, id_pago]
      );

      // Sincronizar con pedido
      await this.sincronizarEstadoPedido(id_pago);
    } catch (error) {
      console.error("Error actualizando estado de pago:", error);
    }
  }

  /**
   * Obtener informaciÃ³n de un pago
   */
  static async obtenerPago(id_pago: number): Promise<Record<string, unknown> | null> {
    try {
      const [pago] = await conexion.query(
        `SELECT * FROM pagos WHERE id_pago = ?`,
        [id_pago]
      );
      return pago as Record<string, unknown> | null;
    } catch (error) {
      console.error("Error obteniendo pago:", error);
      return null;
    }
  }

  /**
   * Obtener pagos de un pedido
   */
  static async obtenerPagosPorPedido(id_pedido: number): Promise<Record<string, unknown>[]> {
    try {
      const pagos = await conexion.query(
        `SELECT * FROM pagos WHERE id_pedido = ? ORDER BY fecha_creacion DESC`,
        [id_pedido]
      );
      return pagos as Record<string, unknown>[];
    } catch (error) {
      console.error("Error obteniendo pagos:", error);
      return [];
    }
  }
}
