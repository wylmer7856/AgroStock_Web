import { Router } from "../Dependencies/dependencias.ts";
import { AdminController } from "../Controller/AdminController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para administración de usuarios
router.get("/admin/usuarios", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosUsuarios);
router.post("/admin/usuarios/crear", AuthMiddleware(['admin']), AdminController.CrearUsuario);
router.put("/admin/usuario/:id_usuario", AuthMiddleware(['admin']), AdminController.EditarUsuario);
router.delete("/admin/usuario/:id_usuario", AuthMiddleware(['admin']), AdminController.EliminarUsuario);

// 📌 Rutas para administración de productos
router.get("/admin/productos", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosProductos);
router.delete("/admin/producto/:id_producto", AuthMiddleware(['admin']), AdminController.EliminarProductoInapropiado);

// 📌 Rutas para administración de reportes
router.get("/admin/reportes", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosReportes);
router.put("/admin/reporte/:id_reporte", AuthMiddleware(['admin']), AdminController.ResolverReporte);
router.delete("/admin/reporte/:id_reporte", AuthMiddleware(['admin']), AdminController.EliminarReporteResuelto);

// 📌 Rutas para estadísticas y actividad
router.get("/admin/estadisticas", AuthMiddleware(['admin']), AdminController.ObtenerEstadisticasGenerales);
router.get("/admin/actividad-reciente", AuthMiddleware(['admin']), AdminController.ObtenerActividadReciente);

// 📌 Rutas para acceso a paneles
router.get("/admin/usuario/:id_usuario/productor", AuthMiddleware(['admin']), AdminController.AccederPanelProductor);
router.get("/admin/usuario/:id_usuario/consumidor", AuthMiddleware(['admin']), AdminController.AccederPanelConsumidor);

// 📌 Rutas para administración de pedidos
router.get("/admin/pedidos", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosPedidos);
router.put("/admin/pedido/:id_pedido/estado", AuthMiddleware(['admin']), AdminController.CambiarEstadoPedido);

// 📌 Rutas para administración de categorías
router.get("/admin/categorias", AuthMiddleware(['admin']), AdminController.ObtenerTodasLasCategorias);
router.post("/admin/categorias", AuthMiddleware(['admin']), AdminController.CrearCategoria);
router.put("/admin/categoria/:id_categoria", AuthMiddleware(['admin']), AdminController.ActualizarCategoria);
router.delete("/admin/categoria/:id_categoria", AuthMiddleware(['admin']), AdminController.EliminarCategoria);

// 📌 Rutas para administración de mensajes
router.get("/admin/mensajes", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosMensajes);
router.delete("/admin/mensaje/:id_mensaje", AuthMiddleware(['admin']), AdminController.EliminarMensaje);

// 📌 Rutas para administración de reseñas
router.get("/admin/resenas", AuthMiddleware(['admin']), AdminController.ObtenerTodasLasResenas);
router.delete("/admin/resena/:id_resena", AuthMiddleware(['admin']), AdminController.EliminarResena);

// 📌 Rutas para administración de notificaciones
// IMPORTANTE: Las rutas más específicas deben ir ANTES de las generales
console.log("📌 Registrando ruta: POST /admin/notificaciones/masiva");
router.post("/admin/notificaciones/masiva", AuthMiddleware(['admin']), AdminController.CrearNotificacionMasiva);
router.get("/admin/notificaciones", AuthMiddleware(['admin']), AdminController.ObtenerTodasLasNotificaciones);
router.post("/admin/notificaciones", AuthMiddleware(['admin']), AdminController.CrearNotificacion);
router.put("/admin/notificacion/:id_notificacion", AuthMiddleware(['admin']), AdminController.ActualizarNotificacion);
router.delete("/admin/notificacion/:id_notificacion", AuthMiddleware(['admin']), AdminController.EliminarNotificacion);

// 📌 Rutas para administración de ubicaciones
router.get("/admin/regiones", AuthMiddleware(['admin']), AdminController.ObtenerRegiones);
router.get("/admin/departamentos", AuthMiddleware(['admin']), AdminController.ObtenerDepartamentos);
router.get("/admin/ciudades", AuthMiddleware(['admin']), AdminController.ObtenerCiudades);

// 📌 Rutas para historial de precios
router.get("/admin/historial-precios", AuthMiddleware(['admin']), AdminController.ObtenerHistorialPrecios);

// 📌 Rutas para carritos y listas de deseos
router.get("/admin/carritos", AuthMiddleware(['admin']), AdminController.ObtenerCarritos);
router.get("/admin/listas-deseos", AuthMiddleware(['admin']), AdminController.ObtenerListasDeseos);

// 📌 Rutas para configuración del sistema
router.get("/admin/configuracion", AuthMiddleware(['admin']), AdminController.ObtenerConfiguracion);
router.put("/admin/configuracion", AuthMiddleware(['admin']), AdminController.ActualizarConfiguracion);

export { router as AdminRouter };
