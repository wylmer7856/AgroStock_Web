import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { MensajesModel, MensajeCreateData } from "../Models/MensajesModel.ts";
import { notificationService } from "../Services/NotificationService.ts";

export class MensajesController {
  
  // 📌 Enviar mensaje
  static async EnviarMensaje(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      console.log('📨 [EnviarMensaje] Body recibido:', JSON.stringify(body, null, 2));
      
      const { id_destinatario, id_producto, asunto, mensaje, tipo_mensaje } = body;
      
      // Obtener userId del contexto (puede ser id o id_usuario)
      const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
      console.log('👤 [EnviarMensaje] Usuario autenticado:', {
        userId,
        userState: ctx.state.user,
        rol: ctx.state.user?.rol
      });

      if (!userId) {
        console.error('❌ [EnviarMensaje] No se encontró userId en ctx.state.user');
        ctx.response.status = 401;
        ctx.response.body = { 
          success: false,
          error: "Usuario no autenticado",
          message: "No se pudo identificar al usuario remitente"
        };
        return;
      }

      if (!id_destinatario || !asunto || !mensaje) {
        console.error('❌ [EnviarMensaje] Faltan campos requeridos:', {
          id_destinatario: !!id_destinatario,
          asunto: !!asunto,
          mensaje: !!mensaje
        });
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "Faltan campos requeridos",
          message: "id_destinatario, asunto y mensaje son requeridos"
        };
        return;
      }

      const mensajeData: MensajeCreateData = {
        id_remitente: userId,
        id_destinatario: Number(id_destinatario),
        id_producto: id_producto ? Number(id_producto) : undefined,
        asunto: String(asunto).trim(),
        mensaje: String(mensaje).trim(),
        tipo_mensaje: tipo_mensaje || 'consulta'
      };

      console.log('💾 [EnviarMensaje] Datos del mensaje a crear:', JSON.stringify(mensajeData, null, 2));

      const mensajeModel = new MensajesModel(mensajeData);
      const result = await mensajeModel.CrearMensaje();

      console.log('📬 [EnviarMensaje] Resultado de CrearMensaje:', JSON.stringify(result, null, 2));

      if (result.success) {
        try {
          await notificationService.notifyNewMessage(
            mensajeData.id_destinatario,
            mensajeData.id_remitente,
            mensajeData.asunto
          );
        } catch (notifyError) {
          console.error("⚠️ [EnviarMensaje] Error al notificar nuevo mensaje:", notifyError);
        }

        ctx.response.status = 201;
        ctx.response.body = {
          success: true,
          message: result.message || "Mensaje enviado exitosamente",
          data: result.mensaje
        };
      } else {
        console.error('❌ [EnviarMensaje] Error al crear mensaje:', result.message);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Error al crear mensaje",
          message: result.message || "No se pudo crear el mensaje"
        };
      }
    } catch (error) {
      console.error("❌ [EnviarMensaje] Error capturado:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido al procesar el mensaje"
      };
    }
  }

  // 📌 Obtener mensajes recibidos
  static async ObtenerMensajesRecibidos(ctx: Context) {
    try {
      const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
      if (!userId) {
        ctx.response.status = 401;
        ctx.response.body = { 
          success: false,
          error: "Usuario no autenticado"
        };
        return;
      }
      const mensajeModel = new MensajesModel();
      const mensajes = await mensajeModel.ObtenerMensajesRecibidos(userId);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        mensajes,
        total: mensajes.length
      };
    } catch (error) {
      console.error("Error en ObtenerMensajesRecibidos:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener mensajes enviados
  static async ObtenerMensajesEnviados(ctx: Context) {
    try {
      const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
      console.log('🔍 [ObtenerMensajesEnviados] Usuario autenticado:', {
        userId,
        userState: ctx.state.user
      });
      
      if (!userId) {
        console.error('❌ [ObtenerMensajesEnviados] No se encontró userId');
        ctx.response.status = 401;
        ctx.response.body = { 
          success: false,
          error: "Usuario no autenticado"
        };
        return;
      }
      
      const mensajeModel = new MensajesModel();
      const mensajes = await mensajeModel.ObtenerMensajesEnviados(userId);

      console.log('📤 [ObtenerMensajesEnviados] Mensajes encontrados:', mensajes.length);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        mensajes,
        total: mensajes.length
      };
    } catch (error) {
      console.error("❌ [ObtenerMensajesEnviados] Error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Marcar mensaje como leído
  static async MarcarComoLeido(ctx: RouterContext<"/mensajes/:id_mensaje/leer"> | Context) {
    try {
      const id_mensaje = (ctx as any).params?.id_mensaje || (ctx as any).request.url.pathname.split('/').filter(Boolean).pop();
      // const userId = ctx.state.user.id; // TODO: Implementar validación de propietario

      if (!id_mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del mensaje requerido" };
        return;
      }

      const mensajeModel = new MensajesModel();
      const result = await mensajeModel.MarcarComoLeido(parseInt(id_mensaje));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en MarcarComoLeido:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar mensaje
  static async EliminarMensaje(ctx: RouterContext<"/mensajes/:id_mensaje"> | Context) {
    try {
      const id_mensaje = (ctx as any).params?.id_mensaje || (ctx as any).request.url.pathname.split('/').filter(Boolean).pop();
      // const userId = ctx.state.user.id; // TODO: Implementar validación de propietario

      if (!id_mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del mensaje requerido" };
        return;
      }

      const mensajeModel = new MensajesModel();
      const result = await mensajeModel.EliminarMensaje(parseInt(id_mensaje));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarMensaje:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener mensajes no leídos
  static async ObtenerMensajesNoLeidos(ctx: Context) {
    try {
      const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
      if (!userId) {
        ctx.response.status = 401;
        ctx.response.body = { 
          success: false,
          error: "Usuario no autenticado"
        };
        return;
      }
      const mensajeModel = new MensajesModel();
      const totalNoLeidos = await mensajeModel.ObtenerMensajesNoLeidos(userId);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        total_no_leidos: totalNoLeidos
      };
    } catch (error) {
      console.error("Error en ObtenerMensajesNoLeidos:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener conversación
  static async ObtenerConversacion(ctx: RouterContext<"/mensajes/conversacion/:id_usuario"> | Context) {
    try {
      const id_usuario = (ctx as any).params?.id_usuario || (ctx as any).request.url.pathname.split('/').pop();
      const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;

      if (!userId) {
        ctx.response.status = 401;
        ctx.response.body = { 
          success: false,
          error: "Usuario no autenticado"
        };
        return;
      }

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "ID del usuario requerido" 
        };
        return;
      }

      const mensajeModel = new MensajesModel();
      const conversacion = await mensajeModel.ObtenerConversacion(userId, parseInt(id_usuario));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        conversacion,
        total: conversacion.length
      };
    } catch (error) {
      console.error("Error en ObtenerConversacion:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Contactar productor desde producto (sin login)
  static async ContactarProductor(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_producto, nombre_contacto, email_contacto, telefono_contacto, mensaje } = body;

      if (!id_producto || !nombre_contacto || !email_contacto || !mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      // Obtener información del producto y productor
      const { conexion } = await import("../Models/Conexion.ts");
      const producto = await conexion.query(`
        SELECT p.*, u.nombre as nombre_productor, u.email as email_productor, u.telefono as telefono_productor
        FROM productos p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.id_producto = ?
      `, [id_producto]);

      if (producto.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Producto no encontrado" };
        return;
      }

      const productor = producto[0];

      // Crear mensaje de contacto
      const mensajeData: MensajeCreateData = {
        id_remitente: 0, // Usuario anónimo
        id_destinatario: productor.id_usuario,
        id_producto: parseInt(id_producto),
        asunto: `Consulta sobre ${producto[0].nombre} - ${nombre_contacto}`,
        mensaje: `
          Nombre: ${nombre_contacto}
          Email: ${email_contacto}
          Teléfono: ${telefono_contacto || 'No proporcionado'}
          
          Mensaje:
          ${mensaje}
        `,
        tipo_mensaje: 'consulta'
      };

      const mensajeModel = new MensajesModel(mensajeData);
      const result = await mensajeModel.CrearMensaje();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = {
          success: true,
          message: "Mensaje enviado exitosamente al productor",
          datos_contacto: {
            nombre_productor: productor.nombre_productor,
            email_productor: productor.email_productor,
            telefono_productor: productor.telefono_productor
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ContactarProductor:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
