import { conexion } from "../Models/Conexion.ts";

interface NotificationData {
  id_usuario: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  leida: boolean;
  fecha: Date;
  datos_extra?: any;
}

interface PushNotificationData {
  to: string;
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  private fcmServerKey: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      const { load } = await import("../Dependencies/dependencias.ts");
      const env = await load();
      
      this.fcmServerKey = env.FCM_SERVER_KEY || null;
      this.isConfigured = !!(this.fcmServerKey);
      
      if (!this.isConfigured) {
        console.warn("⚠️ Push Notifications no configuradas. Las notificaciones push estarán deshabilitadas.");
      } else {
        console.log("✅ NotificationService configurado correctamente");
      }
    } catch (error) {
      console.error("Error al cargar configuración de notificaciones:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Crea una notificación en la base de datos
   */
  async createNotification(data: Omit<NotificationData, 'fecha' | 'leida'>): Promise<{ success: boolean; message: string; notification?: NotificationData }> {
    try {
      // Mapear el tipo antiguo al nuevo tipo de la tabla
      const tipoMap: Record<string, 'pedido' | 'stock' | 'precio' | 'mensaje' | 'sistema' | 'promocion'> = {
        'info': 'sistema',
        'success': 'sistema',
        'warning': 'stock',
        'error': 'sistema'
      };

      const tipoNotificacion = tipoMap[data.tipo] || 'sistema';
      const id_referencia = data.datos_extra?.pedido_id || data.datos_extra?.producto_id || null;
      const tipo_referencia = data.datos_extra?.pedido_id ? 'pedido' : 
                              data.datos_extra?.producto_id ? 'producto' : null;

      await conexion.execute(
        `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_referencia, tipo_referencia) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.id_usuario,
          data.titulo,
          data.mensaje,
          tipoNotificacion,
          id_referencia,
          tipo_referencia
        ]
      );

      console.log(`✅ Notificación creada para usuario ${data.id_usuario}`);
      return {
        success: true,
        message: "Notificación creada correctamente",
        notification: {
          ...data,
          fecha: new Date(),
          leida: false
        }
      };
    } catch (error) {
      console.error("Error al crear notificación:", error);
      return {
        success: false,
        message: "Error al crear notificación"
      };
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  async getUserNotifications(id_usuario: number, limit: number = 50): Promise<NotificationData[]> {
    try {
      const result = await conexion.query(
        `SELECT * FROM notificaciones 
         WHERE id_usuario = ? 
         ORDER BY fecha_creacion DESC 
         LIMIT ?`,
        [id_usuario, limit]
      );

      return result.map((notif: any) => ({
        id_usuario: notif.id_usuario,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        tipo: notif.tipo === 'info' ? 'info' : notif.tipo === 'success' ? 'success' : notif.tipo === 'warning' ? 'warning' : 'error',
        leida: Boolean(notif.leida),
        fecha: new Date(notif.fecha_creacion),
        datos_extra: {
          id_referencia: notif.id_referencia,
          tipo_referencia: notif.tipo_referencia
        }
      }));
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      return [];
    }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id_notificacion: number, id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await conexion.execute(
        "UPDATE notificaciones SET leida = 1, fecha_leida = CURRENT_TIMESTAMP WHERE id_notificacion = ? AND id_usuario = ?",
        [id_notificacion, id_usuario]
      );

      if (result.affectedRows && result.affectedRows > 0) {
        return {
          success: true,
          message: "Notificación marcada como leída"
        };
      } else {
        return {
          success: false,
          message: "Notificación no encontrada"
        };
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      return {
        success: false,
        message: "Error interno del servidor"
      };
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute(
        "UPDATE notificaciones SET leida = 1 WHERE id_usuario = ? AND leida = 0",
        [id_usuario]
      );

      return {
        success: true,
        message: "Todas las notificaciones marcadas como leídas"
      };
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error);
      return {
        success: false,
        message: "Error interno del servidor"
      };
    }
  }

  /**
   * Envía notificación push (si está configurada)
   */
  async sendPushNotification(data: PushNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured) {
        console.log(`📱 Push notification simulado: ${data.title} - ${data.body}`);
        return {
          success: true,
          message: "Push notification simulado (servicio no configurado)"
        };
      }

      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Authorization": `key=${this.fcmServerKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: data.to,
          notification: {
            title: data.title,
            body: data.body,
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png"
          },
          data: data.data || {}
        }),
      });

      if (response.ok) {
        // const result = await response.json(); // TODO: Usar result si se necesita
        console.log(`✅ Push notification enviada: ${data.title}`);
        return {
          success: true,
          message: "Push notification enviada correctamente"
        };
      } else {
        const error = await response.text();
        console.error("Error al enviar push notification:", error);
        return {
          success: false,
          message: "Error al enviar push notification"
        };
      }
    } catch (error) {
      console.error("Error en NotificationService:", error);
      return {
        success: false,
        message: "Error interno del servidor"
      };
    }
  }

  /**
   * Notifica nuevo pedido al productor
   */
  async notifyNewOrder(id_productor: number, pedidoId: number, productos: any[]): Promise<void> {
    try {
      // Crear notificación en base de datos
      await this.createNotification({
        id_usuario: id_productor,
        titulo: "🛒 Nuevo Pedido Recibido",
        mensaje: `Has recibido un nuevo pedido #${pedidoId} con ${productos.length} producto(s)`,
        tipo: 'info',
        datos_extra: {
          pedido_id: pedidoId,
          productos: productos,
          action: 'view_order'
        }
      });

      // Obtener token FCM del usuario (si existe)
      const userToken = await this.getUserFCMToken(id_productor);
      if (userToken) {
        await this.sendPushNotification({
          to: userToken,
          title: "🛒 Nuevo Pedido",
          body: `Pedido #${pedidoId} recibido`,
          data: { pedido_id: pedidoId, type: 'new_order' }
        });
      }
    } catch (error) {
      console.error("Error al notificar nuevo pedido:", error);
    }
  }

  /**
   * Notifica cambio de estado de pedido
   */
  async notifyOrderStatusChange(id_consumidor: number, pedidoId: number, nuevoEstado: string): Promise<void> {
    try {
      const estadoMessages = {
        'confirmado': '✅ Tu pedido ha sido confirmado',
        'comprado': '🚚 Tu pedido está en camino',
        'entregado': '🎉 Tu pedido ha sido entregado',
        'cancelado': '❌ Tu pedido ha sido cancelado'
      };

      const mensaje = estadoMessages[nuevoEstado as keyof typeof estadoMessages] || `Estado del pedido cambiado a: ${nuevoEstado}`;

      await this.createNotification({
        id_usuario: id_consumidor,
        titulo: "📦 Actualización de Pedido",
        mensaje: `${mensaje} - Pedido #${pedidoId}`,
        tipo: nuevoEstado === 'cancelado' ? 'error' : 'success',
        datos_extra: {
          pedido_id: pedidoId,
          nuevo_estado: nuevoEstado,
          action: 'view_order'
        }
      });

      const userToken = await this.getUserFCMToken(id_consumidor);
      if (userToken) {
        await this.sendPushNotification({
          to: userToken,
          title: "📦 Pedido Actualizado",
          body: mensaje,
          data: { pedido_id: pedidoId, estado: nuevoEstado, type: 'order_update' }
        });
      }
    } catch (error) {
      console.error("Error al notificar cambio de estado:", error);
    }
  }

  /**
   * Notifica alerta de stock bajo
   */
  async notifyLowStock(id_productor: number, productos: any[]): Promise<void> {
    try {
      await this.createNotification({
        id_usuario: id_productor,
        titulo: "⚠️ Alerta de Stock Bajo",
        mensaje: `${productos.length} producto(s) tienen stock bajo`,
        tipo: 'warning',
        datos_extra: {
          productos: productos,
          action: 'manage_products'
        }
      });

      const userToken = await this.getUserFCMToken(id_productor);
      if (userToken) {
        await this.sendPushNotification({
          to: userToken,
          title: "⚠️ Stock Bajo",
          body: `${productos.length} productos necesitan reposición`,
          data: { type: 'low_stock', productos: productos }
        });
      }
    } catch (error) {
      console.error("Error al notificar stock bajo:", error);
    }
  }

  /**
   * Notifica nuevo mensaje
   */
  async notifyNewMessage(id_destinatario: number, id_remitente: number, asunto: string): Promise<void> {
    try {
      // Obtener nombre del remitente
      const remitente = await conexion.query(
        "SELECT nombre FROM usuarios WHERE id_usuario = ?",
        [id_remitente]
      );

      const nombreRemitente = remitente[0]?.nombre || 'Usuario';

      await this.createNotification({
        id_usuario: id_destinatario,
        titulo: "💬 Nuevo Mensaje",
        mensaje: `${nombreRemitente} te envió un mensaje: ${asunto}`,
        tipo: 'info',
        datos_extra: {
          id_remitente: id_remitente,
          asunto: asunto,
          action: 'view_messages'
        }
      });

      const userToken = await this.getUserFCMToken(id_destinatario);
      if (userToken) {
        await this.sendPushNotification({
          to: userToken,
          title: "💬 Nuevo Mensaje",
          body: `${nombreRemitente}: ${asunto}`,
          data: { 
            type: 'new_message', 
            id_remitente: id_remitente,
            asunto: asunto 
          }
        });
      }
    } catch (error) {
      console.error("Error al notificar nuevo mensaje:", error);
    }
  }

  /**
   * Obtiene el token FCM de un usuario
   */
  private async getUserFCMToken(id_usuario: number): Promise<string | null> {
    try {
      const result = await conexion.query(
        "SELECT fcm_token FROM usuarios WHERE id_usuario = ? AND fcm_token IS NOT NULL",
        [id_usuario]
      );

      return result[0]?.fcm_token || null;
    } catch (error) {
      console.error("Error al obtener token FCM:", error);
      return null;
    }
  }

  /**
   * Actualiza el token FCM de un usuario
   */
  async updateUserFCMToken(id_usuario: number, fcm_token: string): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute(
        "UPDATE usuarios SET fcm_token = ? WHERE id_usuario = ?",
        [fcm_token, id_usuario]
      );

      return {
        success: true,
        message: "Token FCM actualizado correctamente"
      };
    } catch (error) {
      console.error("Error al actualizar token FCM:", error);
      return {
        success: false,
        message: "Error al actualizar token FCM"
      };
    }
  }

  /**
   * Limpia notificaciones antiguas (más de 30 días)
   */
  async cleanupOldNotifications(): Promise<{ success: boolean; message: string; deleted: number }> {
    try {
      const result = await conexion.execute(
        "DELETE FROM notificaciones WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 30 DAY)"
      );

      return {
        success: true,
        message: "Notificaciones antiguas eliminadas",
        deleted: result.affectedRows || 0
      };
    } catch (error) {
      console.error("Error al limpiar notificaciones:", error);
      return {
        success: false,
        message: "Error al limpiar notificaciones",
        deleted: 0
      };
    }
  }
}

export const notificationService = new NotificationService();
