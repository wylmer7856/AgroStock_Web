import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { NotificacionesModel, NotificacionCreateData } from "../Models/NotificacionesModel.ts";

export class NotificacionesController {
  
  // 📌 Obtener notificaciones del usuario autenticado
  static async ObtenerMisNotificaciones(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const url = new URL(ctx.request.url);
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const soloNoLeidas = url.searchParams.get("soloNoLeidas") === "true";

      const notificacionesModel = new NotificacionesModel({} as NotificacionCreateData);
      const notificaciones = await notificacionesModel.ObtenerNotificacionesPorUsuario(user.id, limit, soloNoLeidas);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        notificaciones,
        total: notificaciones.length
      };
    } catch (error) {
      console.error("Error en ObtenerMisNotificaciones:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Contar notificaciones no leídas
  static async ContarNoLeidas(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const notificacionesModel = new NotificacionesModel({} as NotificacionCreateData);
      const total = await notificacionesModel.ContarNoLeidas(user.id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        totalNoLeidas: total
      };
    } catch (error) {
      console.error("Error en ContarNoLeidas:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Marcar notificación como leída
  static async MarcarComoLeida(ctx: RouterContext<"/notificaciones/:id_notificacion/leer">) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const { id_notificacion } = ctx.params;

      if (!id_notificacion) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID de notificación requerido" };
        return;
      }

      const notificacionesModel = new NotificacionesModel({} as NotificacionCreateData);
      const result = await notificacionesModel.MarcarComoLeida(parseInt(id_notificacion), user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en MarcarComoLeida:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Marcar todas las notificaciones como leídas
  static async MarcarTodasComoLeidas(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const notificacionesModel = new NotificacionesModel({} as NotificacionCreateData);
      const result = await notificacionesModel.MarcarTodasComoLeidas(user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en MarcarTodasComoLeidas:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar notificación
  static async EliminarNotificacion(ctx: RouterContext<"/notificaciones/:id_notificacion">) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const { id_notificacion } = ctx.params;

      if (!id_notificacion) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID de notificación requerido" };
        return;
      }

      const notificacionesModel = new NotificacionesModel({} as NotificacionCreateData);
      const result = await notificacionesModel.EliminarNotificacion(parseInt(id_notificacion), user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarNotificacion:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Crear notificación (solo admin o sistema)
  static async CrearNotificacion(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      // Solo admin puede crear notificaciones manualmente
      if (user.rol !== 'admin') {
        ctx.response.status = 403;
        ctx.response.body = { success: false, error: "No tienes permisos para crear notificaciones" };
        return;
      }

      const body = await ctx.request.body.json();
      const { id_usuario, titulo, mensaje, tipo, id_referencia, tipo_referencia } = body;

      if (!id_usuario || !titulo || !mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "Faltan campos obligatorios: id_usuario, titulo, mensaje" };
        return;
      }

      const notificacionData: NotificacionCreateData = {
        id_usuario,
        titulo,
        mensaje,
        tipo: tipo || 'sistema',
        id_referencia: id_referencia || null,
        tipo_referencia: tipo_referencia || null
      };

      const notificacionesModel = new NotificacionesModel(notificacionData);
      const result = await notificacionesModel.CrearNotificacion();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearNotificacion:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }
}






