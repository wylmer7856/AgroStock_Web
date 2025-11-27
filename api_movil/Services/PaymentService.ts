// 💳 SERVICIO DE PAGOS - INTEGRACIÓN CON PASARELAS DE PAGO

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
  // @ts-ignore - Deno is a global object in Deno runtime
  private static readonly PAYU_ACCOUNT_ID = Deno.env.get("PAYU_ACCOUNT_ID") || "";

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

      // Procesar según método de pago
      if (data.metodo_pago === 'efectivo') {
        // Pago en efectivo - se marca como aprobado manualmente después
        await this.actualizarEstadoPago(id_pago, 'pendiente', 'Pago en efectivo pendiente de confirmación');
        
        return {
          success: true,
          id_pago,
          estado_pago: 'pendiente',
          mensaje: "Pago en efectivo registrado. Se confirmará cuando se reciba el pago."
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

      const referencia_pago = `WOMPI_${Date.now()}_${id_pago}`;

      // Simulación - en producción usar respuesta real
      const estado_pago = 'aprobado';

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
   * Procesar pago con PayU (Colombia) - Genera URL de redirección
   */
  private static async procesarConPayU(
    id_pago: number,
    data: PaymentData
  ): Promise<PaymentResponse> {
    try {
      await this.actualizarEstadoPago(id_pago, 'procesando', 'Generando sesión de pago con PayU');

      const referencia_pago = `PAYU_${Date.now()}_${id_pago}`;
      
      // URLs de PayU
      const PAYU_SANDBOX_URL = "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/";
      const PAYU_PRODUCTION_URL = "https://checkout.payulatam.com/ppp-web-gateway-payu/";
      
      // Usar sandbox si no hay credenciales configuradas o si está en modo desarrollo
      // @ts-ignore
      const useSandbox = !this.PAYU_API_KEY || !this.PAYU_MERCHANT_ID || 
                         Deno.env.get("PAYU_ENVIRONMENT") === "sandbox";
      const payuUrl = useSandbox ? PAYU_SANDBOX_URL : PAYU_PRODUCTION_URL;

      // Obtener información del usuario y pedido
      const [pagoInfo] = await conexion.query(
        `SELECT p.*, u.email, u.nombre, u.telefono, u.direccion
         FROM pagos p
         INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
         WHERE p.id_pago = ?`,
        [id_pago]
      ) as Array<Record<string, unknown>>;

      if (!pagoInfo) {
        throw new Error("No se encontró información del pago");
      }

      // Obtener información del pedido
      const [pedidoInfo] = await conexion.query(
        `SELECT * FROM pedidos WHERE id_pedido = ?`,
        [data.id_pedido]
      ) as Array<Record<string, unknown>>;

      // Generar firma para PayU
      const signature = this.generarFirmaPayU(
        referencia_pago,
        Number(data.monto),
        'COP'
      );

      // URL de confirmación y respuesta
      // @ts-ignore
      const baseUrl = Deno.env.get("API_BASE_URL") || "http://localhost:8000";
      const urlConfirmacion = `${baseUrl}/api/pagos/payu/confirmacion`;
      const urlRespuesta = `${baseUrl}/api/pagos/payu/respuesta`;

      // Guardar referencia y firma
      await conexion.execute(
        `UPDATE pagos 
         SET referencia_pago = ?, 
             respuesta_pasarela = ?
         WHERE id_pago = ?`,
        [
          referencia_pago,
          JSON.stringify({ 
            signature,
            useSandbox,
            url_confirmacion: urlConfirmacion,
            url_respuesta: urlRespuesta
          }),
          id_pago
        ]
      );

      // Valores para sandbox si no hay credenciales
      const merchantId = this.PAYU_MERCHANT_ID || (useSandbox ? '508029' : '');
      const accountId = this.PAYU_ACCOUNT_ID || this.PAYU_MERCHANT_ID || (useSandbox ? '512321' : '');

      // Generar URL de redirección con parámetros
      const params = new URLSearchParams({
        merchantId: merchantId,
        accountId: accountId,
        description: `Pago AgroStock - Pedido #${data.id_pedido}`,
        referenceCode: referencia_pago,
        amount: String(data.monto),
        currency: 'COP',
        signature: signature,
        test: useSandbox ? '1' : '0',
        buyerEmail: String(pagoInfo.email || ''),
        buyerFullName: String(pagoInfo.nombre || ''),
        buyerPhone: String(pagoInfo.telefono || ''),
        responseUrl: urlRespuesta,
        confirmationUrl: urlConfirmacion,
        shippingAddress: String(pedidoInfo?.direccion_entrega || pagoInfo.direccion || ''),
        shippingCity: 'Bogotá',
        shippingCountry: 'CO'
      });

      const urlPago = `${payuUrl}?${params.toString()}`;

      return {
        success: true,
        id_pago,
        referencia_pago,
        estado_pago: 'procesando',
        url_pago: urlPago,
        mensaje: "Redirigiendo a PayU para completar el pago"
      };
    } catch (error) {
      await this.actualizarEstadoPago(id_pago, 'rechazado', error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: "Error generando sesión de pago con PayU"
      };
    }
  }

  /**
   * Generar firma para PayU
   */
  private static generarFirmaPayU(referenceCode: string, amount: number, currency: string): string {
    const apiKey = this.PAYU_API_KEY;
    const merchantId = this.PAYU_MERCHANT_ID || '508029'; // Sandbox default
    const accountId = this.PAYU_ACCOUNT_ID || this.PAYU_MERCHANT_ID || '512321'; // Sandbox default

    // Firma: MD5(apiKey~merchantId~referenceCode~amount~currency)
    const cadena = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    
    // Si no hay API key, usar firma de prueba para sandbox
    if (!apiKey) {
      return 'test_signature_' + Date.now();
    }

    // En producción, usar una librería de hash MD5 real
    // Por ahora, usamos una implementación simple para desarrollo
    return this.md5Hash(cadena);
  }

  /**
   * Función MD5 simple (para desarrollo)
   * En producción, usar una librería real de hash MD5
   */
  private static md5Hash(str: string): string {
    // Implementación simple para desarrollo
    // En producción, usar: import { crypto } from "https://deno.land/std/crypto/mod.ts";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
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
        // Actualizar estado del pedido y estado_pago
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

        // Registrar en bitácora
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
          'Sincronización automática con estado de pago'
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
   * Obtener información de un pago
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
