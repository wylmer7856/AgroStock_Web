import { Router } from "../Dependencies/dependencias.ts";
import { NotificacionesController } from "../Controller/NotificacionesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const NotificacionesRouter = new Router();

// 📌 Notificaciones: Solo usuarios autenticados pueden ver sus notificaciones
NotificacionesRouter.get("/notificaciones", AuthMiddleware(['admin', 'consumidor', 'productor']), NotificacionesController.ObtenerMisNotificaciones);
NotificacionesRouter.get("/notificaciones/contar", AuthMiddleware(['admin', 'consumidor', 'productor']), NotificacionesController.ContarNoLeidas);
NotificacionesRouter.put("/notificaciones/:id_notificacion/leer", AuthMiddleware(['admin', 'consumidor', 'productor']), NotificacionesController.MarcarComoLeida);
NotificacionesRouter.put("/notificaciones/marcar-todas", AuthMiddleware(['admin', 'consumidor', 'productor']), NotificacionesController.MarcarTodasComoLeidas);
NotificacionesRouter.delete("/notificaciones/:id_notificacion", AuthMiddleware(['admin', 'consumidor', 'productor']), NotificacionesController.EliminarNotificacion);
NotificacionesRouter.post("/notificaciones", AuthMiddleware(['admin']), NotificacionesController.CrearNotificacion);

export { NotificacionesRouter };






