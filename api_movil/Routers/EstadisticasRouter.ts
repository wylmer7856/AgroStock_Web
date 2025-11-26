import { Router } from "../Dependencies/dependencias.ts";
import { EstadisticasController } from "../Controller/EstadisticasController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para estadísticas generales (solo admin)
router.get("/estadisticas/generales", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasGenerales);
router.get("/estadisticas/actividad-reciente", AuthMiddleware(['admin']), EstadisticasController.ObtenerActividadReciente);
router.get("/estadisticas/productos-por-categoria", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasProductosPorCategoria);
router.get("/estadisticas/usuarios-por-region", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasUsuariosPorRegion);
router.get("/estadisticas/pedidos", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasPedidos);
router.get("/estadisticas/mensajes", AuthMiddleware(['admin']), EstadisticasController.ObtenerEstadisticasMensajes);

// 📌 Rutas para estadísticas de usuario
router.get("/estadisticas/usuario/:id_usuario", AuthMiddleware(['admin', 'consumidor', 'productor']), EstadisticasController.ObtenerEstadisticasUsuario);
router.put("/estadisticas/usuario/:id_usuario", AuthMiddleware(['admin', 'consumidor', 'productor']), EstadisticasController.ActualizarEstadisticasUsuario);

// 📌 Ruta para estadísticas de ventas del usuario actual (productores)
router.get("/estadisticas/mis-ventas", AuthMiddleware(['productor', 'admin']), EstadisticasController.ObtenerMisVentas);

export { router as EstadisticasRouter };
