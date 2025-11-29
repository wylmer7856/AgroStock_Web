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
      
      // URLs de PayU - Usar la URL correcta para Colombia
      const PAYU_SANDBOX_URL = "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/";
      const PAYU_PRODUCTION_URL = "https://checkout.payulatam.com/ppp-web-gateway-payu/";
      
      console.log("[PayU] Iniciando procesamiento de pago:", {
        id_pago,
        id_pedido: data.id_pedido,
        monto: data.monto
      });
      
      // Usar sandbox si no hay credenciales configuradas o si está en modo desarrollo
      // @ts-ignore: Deno.env es global en runtime de Deno
      const payuEnvironment = Deno.env.get("PAYU_ENVIRONMENT") || "sandbox";
      // @ts-ignore: Deno.env es global en runtime de Deno
      const useSandbox = payuEnvironment === "sandbox" || 
                         !this.PAYU_API_KEY || 
                         !this.PAYU_MERCHANT_ID ||
                         this.PAYU_API_KEY.trim() === '' ||
                         this.PAYU_MERCHANT_ID.trim() === '';
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
      // @ts-ignore: Deno.env es global en runtime de Deno
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

      // Valores para sandbox si no hay credenciales configuradas
      // PayU Sandbox valores por defecto para pruebas
      const merchantId = (this.PAYU_MERCHANT_ID && this.PAYU_MERCHANT_ID.trim() !== '') 
        ? this.PAYU_MERCHANT_ID 
        : (useSandbox ? '508029' : '');
      const accountId = (this.PAYU_ACCOUNT_ID && this.PAYU_ACCOUNT_ID.trim() !== '') 
        ? this.PAYU_ACCOUNT_ID 
        : (this.PAYU_MERCHANT_ID && this.PAYU_MERCHANT_ID.trim() !== '' 
          ? this.PAYU_MERCHANT_ID 
          : (useSandbox ? '512321' : ''));

      // Generar URL de redirección con parámetros según documentación de PayU
      // Para PayU Colombia, los parámetros requeridos son:
      // Nota: PayU requiere que el monto sea un número entero (sin decimales) en centavos
      const montoEntero = Math.round(Number(data.monto));
      const params = new URLSearchParams({
        merchantId: merchantId,
        accountId: accountId,
        description: `Pago AgroStock - Pedido #${data.id_pedido}`,
        referenceCode: referencia_pago,
        amount: String(montoEntero),
        currency: 'COP',
        signature: signature,
        test: useSandbox ? '1' : '0',
        buyerEmail: String(pagoInfo.email || 'test@test.com'),
        buyerFullName: String(pagoInfo.nombre || 'Usuario Test'),
        buyerPhone: String(pagoInfo.telefono || '7000000'),
        responseUrl: urlRespuesta,
        confirmationUrl: urlConfirmacion,
        shippingAddress: String(pedidoInfo?.direccion_entrega || pagoInfo.direccion || 'Calle Test 123'),
        shippingCity: 'Bogotá',
        shippingCountry: 'CO'
      });

      const urlPago = `${payuUrl}?${params.toString()}`;
      
      console.log("[PayU] URL generada:", {
        url: urlPago.substring(0, 100) + "...",
        merchantId,
        accountId,
        referenceCode: referencia_pago,
        amount: montoEntero,
        signature: signature.substring(0, 20) + "...",
        useSandbox
      });

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
   * Generar firma para PayU usando MD5
   * Firma: MD5(apiKey~merchantId~referenceCode~amount~currency)
   * Nota: El amount debe ser un número entero (sin decimales)
   */
  private static generarFirmaPayU(referenceCode: string, amount: number, currency: string): string {
    // @ts-ignore: Deno.env es global en runtime de Deno
    const apiKey = Deno.env.get("PAYU_API_KEY") || this.PAYU_API_KEY || '';
    const merchantId = this.PAYU_MERCHANT_ID || '508029'; // Sandbox default para pruebas
    
    // PayU requiere que el monto sea un número entero (sin decimales)
    const montoEntero = Math.round(amount);
    
    // Firma: MD5(apiKey~merchantId~referenceCode~amount~currency)
    const cadena = `${apiKey}~${merchantId}~${referenceCode}~${montoEntero}~${currency}`;
    
    console.log("[PayU] Generando firma:", {
      cadena: cadena.substring(0, 50) + "...",
      referenceCode,
      montoEntero,
      currency
    });
    
    // Usar MD5 para generar la firma
    const firma = this.md5(cadena);
    console.log("[PayU] Firma generada:", firma.substring(0, 20) + "...");
    
    return firma;
  }

  /**
   * Implementación MD5 para generar firmas de PayU
   * Implementación MD5 pura en TypeScript sin dependencias externas
   */
  static md5(str: string): string {
    // Funciones auxiliares MD5
    function add32(a: number, b: number): number {
      return (a + b) & 0xFFFFFFFF;
    }

    function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function md5blk(s: Uint8Array): number[] {
      const md5blks: number[] = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s[i] + (s[i + 1] << 8) + (s[i + 2] << 16) + (s[i + 3] << 24);
      }
      return md5blks;
    }

    function md5cycle(x: number[], k: number[]) {
      let a = x[0], b = x[1], c = x[2], d = x[3];

      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);

      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);

      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);

      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);

      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }

    const utf8 = new TextEncoder().encode(str);
    const len = utf8.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;

    for (i = 64; i <= len; i += 64) {
      md5cycle(state, md5blk(utf8.subarray(i - 64, i)));
    }

    const remaining = utf8.subarray(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < remaining.length; i++) {
      tail[i >> 2] |= remaining[i] << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = len * 8;
    md5cycle(state, tail);

    return PaymentService.hex(state);
  }

  /**
   * Convierte un array de números a hexadecimal
   */
  private static hex(x: number[]): string {
    for (let i = 0; i < x.length; i++) {
      x[i] = x[i] >>> 0;
    }
    const hex = '0123456789abcdef';
    let str = '';
    for (let i = 0; i < x.length * 4; i++) {
      str += hex.charAt((x[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
             hex.charAt((x[i >> 2] >> ((i % 4) * 8)) & 0xF);
    }
    return str;
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
