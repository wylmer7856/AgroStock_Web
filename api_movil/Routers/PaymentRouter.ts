import { Router } from "../Dependencies/dependencias.ts";
import { PaymentController } from "../Controller/PaymentController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

export const PaymentRouter = new Router();

PaymentRouter.post("/pagos", AuthMiddleware(['consumidor', 'admin']), PaymentController.crearPago);
PaymentRouter.get("/pagos/:id", AuthMiddleware(['consumidor', 'productor', 'admin']), PaymentController.obtenerPago);
PaymentRouter.get("/pagos/pedido/:id_pedido", AuthMiddleware(['consumidor', 'productor', 'admin']), PaymentController.obtenerPagosPorPedido);
PaymentRouter.put("/pagos/estado", AuthMiddleware(['admin']), PaymentController.actualizarEstadoPago);
PaymentRouter.post("/pagos/stripe/create-intent", AuthMiddleware(['consumidor', 'admin']), PaymentController.crearStripePaymentIntent);
PaymentRouter.post("/pagos/stripe/confirmar", AuthMiddleware(['consumidor', 'admin']), PaymentController.confirmarPagoStripe);
PaymentRouter.post("/pagos/stripe/webhook", PaymentController.stripeWebhook);






