import { Router } from "../Dependencies/dependencias.ts";
import { MensajesController } from "../Controller/MensajesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para mensajes (requieren autenticación)
// Las rutas NO deben tener el prefijo /mensajes porque el router se registra directamente
router.post("/mensajes/enviar", AuthMiddleware(['consumidor', 'productor']), MensajesController.EnviarMensaje);
router.get("/mensajes/recibidos", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerMensajesRecibidos);
router.get("/mensajes/enviados", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerMensajesEnviados);
router.put("/mensajes/:id_mensaje/leer", AuthMiddleware(['consumidor', 'productor']), MensajesController.MarcarComoLeido);
router.delete("/mensajes/:id_mensaje", AuthMiddleware(['consumidor', 'productor']), MensajesController.EliminarMensaje);
router.get("/mensajes/no-leidos", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerMensajesNoLeidos);
router.get("/mensajes/conversacion/:id_usuario", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerConversacion);

// 📌 Ruta para contactar productor (sin autenticación)
router.post("/mensajes/contactar-productor", MensajesController.ContactarProductor);

// Debug: Log de rutas registradas
console.log("📋 MensajesRouter - Rutas registradas:");
console.log("  POST /mensajes/enviar");
console.log("  GET /mensajes/recibidos");
console.log("  GET /mensajes/enviados");
console.log("  PUT /mensajes/:id_mensaje/leer");
console.log("  DELETE /mensajes/:id_mensaje");
console.log("  GET /mensajes/no-leidos");
console.log("  GET /mensajes/conversacion/:id_usuario");
console.log("  POST /mensajes/contactar-productor");

export { router as MensajesRouter };
