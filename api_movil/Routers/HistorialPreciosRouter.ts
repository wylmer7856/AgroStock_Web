import { Router } from "../Dependencies/dependencias.ts";
import { HistorialPreciosController } from "../Controller/HistorialPreciosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const HistorialPreciosRouter = new Router();

// 📌 Historial de precios: Público para ver, pero con autenticación para algunas rutas
HistorialPreciosRouter.get("/historial-precios", HistorialPreciosController.ListarHistorialPrecios);
HistorialPreciosRouter.get("/historial-precios/producto/:id_producto", HistorialPreciosController.ObtenerHistorialPorProducto);
HistorialPreciosRouter.get("/historial-precios/producto/:id_producto/ultimo", HistorialPreciosController.ObtenerUltimoPrecio);

export { HistorialPreciosRouter };






