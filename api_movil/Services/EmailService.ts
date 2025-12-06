import { load } from "../Dependencies/dependencias.ts";

// Importar librería SMTP para Deno
const SMTP = await import("https://deno.land/x/smtp@v0.9.0/mod.ts").catch(() => null);

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private config!: EmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const env = await load();
      
      this.config = {
        host: env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(env.SMTP_PORT || "465"), // Gmail usa 465 para SSL/TLS
        user: env.SMTP_USER || env.SMTP_EMAIL || "",
        pass: env.SMTP_PASS || env.SMTP_PASSWORD || "",
        secure: env.SMTP_SECURE === "true" || env.SMTP_PORT === "465"
      };
      
      console.log(`📧 Configuración SMTP cargada:`);
      console.log(`   Host: ${this.config.host}`);
      console.log(`   Port: ${this.config.port}`);
      console.log(`   User: ${this.config.user ? this.config.user.substring(0, 3) + '***' : 'NO CONFIGURADO'}`);
      console.log(`   Pass: ${this.config.pass ? '***' + this.config.pass.substring(this.config.pass.length - 3) : 'NO CONFIGURADO'}`);

      this.isConfigured = !!(this.config.user && this.config.pass);
      
      if (!this.isConfigured) {
        console.warn("⚠️ EmailService no configurado. Las funciones de email estarán deshabilitadas.");
      } else {
        console.log("✅ EmailService configurado correctamente");
      }
    } catch (error) {
      console.error("Error al cargar configuración de email:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Envía un email usando Resend API o Gmail SMTP
   */
  async sendEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured) {
        const errorMsg = `⚠️ EmailService no configurado. Email NO enviado a: ${data.to}`;
        console.error(errorMsg);
        console.error(`⚠️ Para configurar, crea un archivo .env en api_movil/ con:`);
        console.error(`   SMTP_USER=tu_email@gmail.com`);
        console.error(`   SMTP_PASS=tu_resend_api_key (obtén una en https://resend.com/api-keys)`);
        console.error(`   O para Gmail:`);
        console.error(`   SMTP_PASS=tu_app_password_de_gmail`);
        return {
          success: false,
          message: "EmailService no configurado. Verifica las variables SMTP_USER y SMTP_PASS en el archivo .env"
        };
      }

      console.log(`📧 Intentando enviar email a: ${data.to}`);
      console.log(`📧 Asunto: ${data.subject}`);

      // Intentar usar Resend API primero (si SMTP_PASS parece una API key de Resend)
      // Las API keys de Resend empiezan con "re_"
      if (this.config.pass.startsWith("re_")) {
        console.log(`📧 Usando Resend API...`);
        return await this.sendWithResend(data);
      }

      // Si no, intentar con Gmail usando un servicio SMTP simple
      console.log(`📧 Usando Gmail SMTP...`);
      return await this.sendWithGmailSMTP(data);
    } catch (error) {
      console.error("❌ Error en EmailService:", error);
      return {
        success: false,
        message: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Envía email usando Resend API
   */
  private async sendWithResend(data: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.pass}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `AgroStock <${this.config.user}>`,
          to: [data.to],
          subject: data.subject,
          html: data.html,
          text: data.text
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Email enviado exitosamente a: ${data.to} (Resend)`);
        return {
          success: true,
          message: "Email enviado correctamente"
        };
      } else {
        console.error("❌ Error al enviar email con Resend:", result);
        return {
          success: false,
          message: `Error al enviar email: ${result.message || 'Error desconocido'}`
        };
      }
    } catch (error) {
      console.error("❌ Error en sendWithResend:", error);
      throw error;
    }
  }

  /**
   * Envía email usando Gmail SMTP directamente
   * Nota: Para Gmail necesitas una "App Password", no tu contraseña normal
   */
  private async sendWithGmailSMTP(data: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      // Gmail requiere puerto 465 con TLS directo
      const smtpPort = this.config.port === 465 ? 465 : 465; // Forzar 465 para Gmail
      
      console.log(`📧 Conectando a ${this.config.host}:${smtpPort} con TLS...`);
      
      // Conectar con TLS directo (puerto 465)
      const conn = await Deno.connectTls({
        hostname: this.config.host,
        port: smtpPort,
      });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buffer = new Uint8Array(4096);
      let bytesRead = 0;

      // Leer saludo inicial
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta del servidor SMTP" };
      }
      let response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP: ${response}`);

      // EHLO
      await conn.write(encoder.encode(`EHLO ${this.config.host}\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta EHLO" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP EHLO: OK`);

      // AUTH LOGIN
      await conn.write(encoder.encode(`AUTH LOGIN\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta AUTH" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP AUTH: ${response}`);

      // Usuario (base64)
      const userB64 = btoa(this.config.user);
      await conn.write(encoder.encode(`${userB64}\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta USER" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP USER: OK`);

      // Contraseña (base64)
      const passB64 = btoa(this.config.pass);
      await conn.write(encoder.encode(`${passB64}\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta PASS" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP PASS: ${response}`);

      if (!response.includes("235") && !response.includes("2.7.0") && !response.includes("250")) {
        conn.close();
        console.error(`❌ Error de autenticación: ${response}`);
        return {
          success: false,
          message: `Error de autenticación SMTP: ${response}. Verifica que SMTP_PASS sea una App Password de Gmail (no tu contraseña normal). Obtén una en: https://myaccount.google.com/apppasswords`
        };
      }

      // MAIL FROM
      await conn.write(encoder.encode(`MAIL FROM:<${this.config.user}>\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta MAIL FROM" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP MAIL FROM: ${response}`);

      if (!response.startsWith("250")) {
        conn.close();
        return {
          success: false,
          message: `Error MAIL FROM: ${response}`
        };
      }

      // RCPT TO
      await conn.write(encoder.encode(`RCPT TO:<${data.to}>\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta RCPT TO" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP RCPT TO: ${response}`);

      if (!response.startsWith("250")) {
        conn.close();
        return {
          success: false,
          message: `Error RCPT TO: ${response}`
        };
      }

      // DATA
      await conn.write(encoder.encode(`DATA\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta DATA" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP DATA: ${response}`);

      // Construir mensaje MIME
      const emailBody = this.buildMIMEMessage(data);
      
      // Enviar email
      await conn.write(encoder.encode(`${emailBody}\r\n.\r\n`));
      bytesRead = await conn.read(buffer);
      if (bytesRead === null) {
        conn.close();
        return { success: false, message: "Error: No se recibió respuesta al enviar email" };
      }
      response = decoder.decode(buffer.subarray(0, bytesRead)).trim();
      console.log(`📧 SMTP SEND: ${response}`);

      // QUIT
      await conn.write(encoder.encode(`QUIT\r\n`));
      conn.close();

      if (response.startsWith("250")) {
        console.log(`✅ Email enviado exitosamente a: ${data.to} (Gmail SMTP)`);
        return {
          success: true,
          message: "Email enviado correctamente"
        };
      } else {
        return {
          success: false,
          message: `Error al enviar: ${response}`
        };
      }
    } catch (error) {
      console.error("❌ Error en sendWithGmailSMTP:", error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      // Mensajes de error más claros
      if (errorMsg.includes("connection") || errorMsg.includes("TLS") || errorMsg.includes("certificate")) {
        return {
          success: false,
          message: `Error de conexión SMTP: ${errorMsg}. Asegúrate de usar SMTP_PORT=465 y que tu App Password de Gmail sea correcta.`
        };
      }
      
      return {
        success: false,
        message: `Error SMTP: ${errorMsg}`
      };
    }
  }

  /**
   * Construye mensaje MIME
   */
  private buildMIMEMessage(data: EmailData): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    const message = [
      `From: AgroStock <${this.config.user}>`,
      `To: ${data.to}`,
      `Subject: ${data.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      data.text || this.stripHTML(data.html),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      data.html,
      ``,
      `--${boundary}--`
    ].join('\r\n');
    
    return message;
  }

  /**
   * Envía email vía SMTP usando un servicio simple
   * Nota: Para producción, se recomienda usar Resend, SendGrid o Mailgun
   */
  private async sendViaSMTP(emailBody: string, data: EmailData): Promise<{ success: boolean; message: string }> {
    // Para Gmail, necesitas una "App Password" (no tu contraseña normal)
    // Obtén una en: https://myaccount.google.com/apppasswords
    
    // Por ahora, vamos a recomendar usar Resend que es más simple
    console.error("❌ SMTP directo no está completamente implementado.");
    console.error("💡 Recomendación: Usa Resend API (gratis hasta 3,000 emails/mes)");
    console.error("   1. Regístrate en https://resend.com");
    console.error("   2. Obtén tu API key en https://resend.com/api-keys");
    console.error("   3. Agrega al .env: SMTP_PASS=re_tu_api_key_aqui");
    
    return {
      success: false,
      message: "SMTP directo requiere configuración adicional. Usa Resend API (ver instrucciones en consola)"
    };
  }

  /**
   * Elimina HTML de un string
   */
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * Envía email de bienvenida a nuevos usuarios
   */
  async sendWelcomeEmail(email: string, nombre: string, rol: string): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido a AgroStock</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2e7d32; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Bienvenido a AgroStock</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Te damos la bienvenida a AgroStock, la plataforma que conecta productores y consumidores de productos agrícolas frescos.</p>
            
            <p><strong>Tu rol:</strong> ${this.getRolDescription(rol)}</p>
            
            <h3>¿Qué puedes hacer ahora?</h3>
            <ul>
              ${this.getRolActions(rol)}
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" class="button">Comenzar a usar AgroStock</a>
            </p>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© 2024 AgroStock - Conectando el campo con la ciudad</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "🌱 Bienvenido a AgroStock - Tu cuenta está lista",
      html: html,
      text: `Bienvenido a AgroStock ${nombre}! Tu cuenta como ${rol} está lista. Visita http://localhost:3000 para comenzar.`
    });
  }

  /**
   * Envía notificación de nuevo pedido - VERSIÓN PROFESIONAL
   */
  async sendOrderNotification(
    email: string,
    nombre: string,
    pedidoId: number,
    productosRaw: Array<{ nombre?: string; cantidad?: number; unidadMedida?: string; unidad_medida?: string; precio_unitario?: number; precioUnitario?: number; precio?: number }>,
    total?: number
  ): Promise<{ success: boolean; message: string }> {
    const productos = productosRaw.map((p) => {
      const cantidad = Number(p.cantidad ?? 0) || 0;
      const precioUnitario = Number(p.precio_unitario ?? p.precioUnitario ?? p.precio ?? 0) || 0;
      const unidadMedida = p.unidadMedida ?? p.unidad_medida ?? 'unidades';

      return {
        nombre: p.nombre || 'Producto',
        cantidad,
        unidadMedida,
        precioUnitario,
      };
    });

    const totalProductos = productos.reduce((sum, p) => sum + (p.precioUnitario * p.cantidad), 0);
    const totalPedido = typeof total === 'number' && !Number.isNaN(total) ? total : totalProductos;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Pedido - AgroStock</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; }
          .order-info { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800; }
          .product { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4caf50; display: flex; justify-content: space-between; align-items: center; }
          .product-info { flex: 1; }
          .product-name { font-weight: bold; color: #2d5016; margin-bottom: 5px; }
          .product-details { color: #666; font-size: 14px; }
          .product-price { font-weight: bold; color: #4caf50; font-size: 16px; }
          .total { background: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .total-label { color: #666; font-size: 14px; }
          .total-amount { font-size: 28px; font-weight: bold; color: #2d5016; margin-top: 10px; }
          .button { display: inline-block; background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #2d5016; }
          .footer { text-align: center; padding: 20px; color: #666; background: #f9f9f9; font-size: 12px; }
          .footer a { color: #4caf50; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Nuevo Pedido Recibido</h1>
          </div>
          <div class="content">
            <div class="greeting">
              <h2>¡Hola ${nombre}!</h2>
            </div>
            <p>Has recibido un nuevo pedido en AgroStock. Aquí están los detalles:</p>
            
            <div class="order-info">
              <strong>Número de Pedido:</strong> #${pedidoId}<br>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            <h3 style="color: #2d5016; margin-top: 30px;">Productos solicitados:</h3>
            ${productos.map(p => `
              <div class="product">
                <div class="product-info">
                  <div class="product-name">${p.nombre}</div>
                  <div class="product-details">
                    Cantidad: ${p.cantidad} ${p.unidadMedida || 'unidades'} • 
                    Precio unitario: $${p.precioUnitario.toLocaleString()}
                  </div>
                </div>
                <div class="product-price">
                  $${(p.precioUnitario * p.cantidad).toLocaleString()}
                </div>
              </div>
            `).join('')}
            
            <div class="total">
              <div class="total-label">Total del Pedido</div>
              <div class="total-amount">$${totalPedido.toLocaleString()} COP</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/pedidos/${pedidoId}" class="button">Ver Detalles del Pedido</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Recibirás una notificación cuando el pedido cambie de estado. 
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
          <div class="footer">
            <p><strong>AgroStock</strong> - Conectando el campo con la ciudad</p>
            <p>© ${new Date().getFullYear()} AgroStock. Todos los derechos reservados.</p>
            <p><a href="${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/soporte">Centro de Ayuda</a> | 
               <a href="${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/terminos-condiciones">Términos y Condiciones</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `🛒 Nuevo Pedido #${pedidoId} - AgroStock`,
      html: html,
      text: `Nuevo pedido #${pedidoId} recibido en AgroStock.\n\nProductos:\n${productos.map(p => `- ${p.nombre} (${p.cantidad} ${p.unidadMedida || 'unidades'}) - $${(p.precioUnitario * p.cantidad).toLocaleString()}`).join('\n')}\n\nTotal: $${totalPedido.toLocaleString()} COP\n\nVer pedido: ${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/pedidos/${pedidoId}`
    });
  }

  /**
   * Envía alerta de stock bajo
   */
  async sendLowStockAlert(email: string, nombre: string, productos: Array<{ nombre: string; stock_actual: number; stockMinimo: number; unidadMedida?: string }>): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Stock Bajo - AgroStock</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { background: #ffebee; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f44336; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Stock Bajo</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Los siguientes productos tienen stock bajo y necesitan reposición:</p>
            
            ${productos.map(p => `
              <div class="alert">
                <strong>${p.nombre}</strong><br>
                Stock actual: ${p.stock_actual} ${p.unidadMedida || 'unidades'}<br>
                Stock mínimo: ${p.stockMinimo} ${p.unidadMedida || 'unidades'}
              </div>
            `).join('')}
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/productos" style="background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gestionar Productos</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 AgroStock</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "⚠️ Alerta de Stock Bajo - AgroStock",
      html: html,
      text: `Alerta de stock bajo para: ${productos.map(p => p.nombre).join(', ')}`
    });
  }

  private getRolDescription(rol: string): string {
    switch (rol) {
      case 'admin':
        return 'Administrador - Puedes gestionar toda la plataforma';
      case 'productor':
        return 'Productor - Puedes vender tus productos agrícolas';
      case 'consumidor':
        return 'Consumidor - Puedes comprar productos frescos';
      default:
        return 'Usuario';
    }
  }

  /**
   * Envía email de recuperación de contraseña con código
   */
  async sendPasswordRecoveryCode(
    email: string, 
    nombre: string, 
    codigo: string
  ): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: #ffffff; border: 3px solid #4a7c2a; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
          .code { font-size: 48px; font-weight: bold; color: #2d5016; letter-spacing: 10px; font-family: 'Courier New', monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña en AgroStock.</p>
            <p>Ingresa el siguiente código en la página de recuperación de contraseña:</p>
            <div class="code-box">
              <div class="code">${codigo}</div>
            </div>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este código expirará en 1 hora</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>Nunca compartas este código con nadie</li>
              </ul>
            </div>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AgroStock. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "🔐 Código de Recuperación de Contraseña - AgroStock",
      html: html,
      text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nTu código de recuperación es: ${codigo}\n\nEste código expira en 1 hora.\n\nSi no solicitaste este cambio, ignora este email.`
    });
  }

  /**
   * Envía email de recuperación de contraseña (método antiguo con token)
   */
  async sendPasswordRecoveryEmail(
    email: string, 
    nombre: string, 
    token: string
  ): Promise<{ success: boolean; message: string }> {
    // @ts-ignore - Deno is a global object in Deno runtime
    const recoveryUrl = `${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/password-recovery?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #4a7c2a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #2d5016; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña en AgroStock.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${recoveryUrl}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #4a7c2a;">${recoveryUrl}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en 1 hora</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>Nunca compartas este enlace con nadie</li>
              </ul>
            </div>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AgroStock. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: "🔐 Recuperación de Contraseña - AgroStock",
      html: html,
      text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nVisita: ${recoveryUrl}\n\nEste enlace expira en 1 hora.\n\nSi no solicitaste este cambio, ignora este email.`
    });
  }

  private getRolActions(rol: string): string {
    switch (rol) {
      case 'admin':
        return `
          <li>Gestionar usuarios y productos</li>
          <li>Ver estadísticas y reportes</li>
          <li>Moderar contenido</li>
          <li>Configurar la plataforma</li>
        `;
      case 'productor':
        return `
          <li>Agregar y gestionar tus productos</li>
          <li>Recibir pedidos de consumidores</li>
          <li>Ver estadísticas de ventas</li>
          <li>Comunicarte con tus clientes</li>
        `;
      case 'consumidor':
        return `
          <li>Explorar productos frescos</li>
          <li>Realizar pedidos</li>
          <li>Calificar productos</li>
          <li>Contactar productores</li>
        `;
      default:
        return '<li>Explorar la plataforma</li>';
    }
  }
}

export const emailService = new EmailService();
