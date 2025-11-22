// 💳 ROUTER DE PAGOS

import { Router } from "../Dependencies/dependencias.ts";
import { PaymentController } from "../Controller/PaymentController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

export const PaymentRouter = new Router();

// ✅ Pagos: Consumidor puede crear y ver sus pagos, productor puede ver pagos de sus pedidos, admin puede todo
// Crear pago: solo consumidor (o admin)
PaymentRouter.post("/pagos", AuthMiddleware(['consumidor', 'admin']), PaymentController.crearPago);

// Obtener pago por ID: consumidor ve sus pagos, productor ve pagos de sus pedidos, admin ve todo
PaymentRouter.get("/pagos/:id", AuthMiddleware(['consumidor', 'productor', 'admin']), PaymentController.obtenerPago);

// Obtener pagos de un pedido: consumidor, productor del pedido, o admin
PaymentRouter.get("/pagos/pedido/:id_pedido", AuthMiddleware(['consumidor', 'productor', 'admin']), PaymentController.obtenerPagosPorPedido);

// Actualizar estado de pago: solo admin o webhook (validación en controller)
PaymentRouter.put("/pagos/estado", AuthMiddleware(['admin']), PaymentController.actualizarEstadoPago);






