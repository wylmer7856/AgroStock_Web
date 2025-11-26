import { Router } from "../Dependencies/dependencias.ts";
import { getPedidos, postPedido, putPedido, deletePedido, getMisPedidos, getPedidoPorId, getPedidosRecibidos, getPedidosRealizados} from "../Controller/PedidosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const pedidosRouter = new Router();

// ✅ Rutas protegidas con autenticación - Usar nombres estándar REST (minúsculas, plural)
// IMPORTANTE: Las rutas específicas DEBEN ir ANTES de las rutas con parámetros
// Admin puede ver todos los pedidos, productor y consumidor solo los suyos
pedidosRouter.get("/pedidos/recibidos", AuthMiddleware(['productor', 'admin']), getPedidosRecibidos); // Productores pueden ver pedidos recibidos - DEBE IR ANTES DE /pedidos/:id
pedidosRouter.get("/pedidos/realizados", AuthMiddleware(['consumidor', 'admin']), getPedidosRealizados); // Consumidores pueden ver pedidos realizados - DEBE IR ANTES DE /pedidos/:id
pedidosRouter.get("/pedidos/mis-pedidos", AuthMiddleware(['productor', 'consumidor']), getMisPedidos); // Productores y consumidores pueden ver sus pedidos
pedidosRouter.get("/pedidos", AuthMiddleware(['admin']), getPedidos); // Solo admin puede ver todos los pedidos
pedidosRouter.get("/pedidos/:id", AuthMiddleware(['productor', 'consumidor', 'admin']), getPedidoPorId); // Obtener pedido por ID con detalles - DEBE IR AL FINAL

// Crear pedido: solo consumidor (o admin puede crear en nombre de otros)
pedidosRouter.post("/pedidos", AuthMiddleware(['consumidor', 'admin']), postPedido);

// Actualizar pedido: productor puede actualizar estado, consumidor puede actualizar su pedido, admin puede todo
pedidosRouter.put("/pedidos/:id", AuthMiddleware(['productor', 'consumidor', 'admin']), putPedido);

// Eliminar pedido: solo admin o el consumidor que lo creó (con validación en controller)
pedidosRouter.delete("/pedidos/:id", AuthMiddleware(['consumidor', 'admin']), deletePedido);

export { pedidosRouter };