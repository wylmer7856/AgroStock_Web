import { Router } from "../Dependencies/dependencias.ts";
import { CartController } from "../Controller/CartController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const CartRouter = new Router();

// ✅ Carrito: Solo consumidores pueden usar el carrito (admin puede ver para gestión)
CartRouter.get("/cart", AuthMiddleware(['consumidor', 'admin']), CartController.getCart);
CartRouter.post("/cart/add", AuthMiddleware(['consumidor', 'admin']), CartController.addToCart);
CartRouter.put("/cart/item/:id", AuthMiddleware(['consumidor', 'admin']), CartController.updateCartItem);
CartRouter.delete("/cart/item/:id", AuthMiddleware(['consumidor', 'admin']), CartController.removeFromCart);
CartRouter.delete("/cart/clear", AuthMiddleware(['consumidor', 'admin']), CartController.clearCart);
CartRouter.get("/cart/validate", AuthMiddleware(['consumidor', 'admin']), CartController.validateCart);
CartRouter.post("/cart/checkout", AuthMiddleware(['consumidor', 'admin']), CartController.checkout);
CartRouter.get("/cart/stats", AuthMiddleware(['consumidor', 'admin']), CartController.getCartStats);

export { CartRouter };
