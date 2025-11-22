import { Router } from "../Dependencies/dependencias.ts";
import { ListaDeseosController } from "../Controller/ListaDeseosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ListaDeseosRouter = new Router();

// 📌 Lista de deseos: Solo consumidores pueden usar la lista de deseos
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
ListaDeseosRouter.get("/lista-deseos", AuthMiddleware(['consumidor', 'admin']), ListaDeseosController.ObtenerMiListaDeseos);
ListaDeseosRouter.post("/lista-deseos", AuthMiddleware(['consumidor', 'admin']), ListaDeseosController.AgregarAListaDeseos);
ListaDeseosRouter.delete("/lista-deseos/limpiar", AuthMiddleware(['consumidor', 'admin']), ListaDeseosController.LimpiarListaDeseos);
ListaDeseosRouter.delete("/lista-deseos/producto/:id_producto", AuthMiddleware(['consumidor', 'admin']), ListaDeseosController.EliminarProductoDeListaDeseos);
ListaDeseosRouter.get("/lista-deseos/producto/:id_producto/verificar", AuthMiddleware(['consumidor', 'admin']), ListaDeseosController.VerificarProductoEnLista);
ListaDeseosRouter.delete("/lista-deseos/:id_lista", AuthMiddleware(['consumidor', 'admin']), ListaDeseosController.EliminarDeListaDeseos);

export { ListaDeseosRouter };






