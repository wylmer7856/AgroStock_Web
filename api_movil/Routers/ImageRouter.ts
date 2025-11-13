// 🖼️ ROUTER DE IMÁGENES

import { Router } from "../Dependencies/dependencias.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";
import {
  uploadProductImage,
  uploadProductorProfileImage,
  deleteImage,
  uploadProductAdditionalImage,
  deleteProductAdditionalImage
} from "../Controller/ImageController.ts";

export const ImageRouter = new Router();

// Rutas protegidas
ImageRouter
  .post("/images/producto/:id", AuthMiddleware(['productor', 'admin']), uploadProductImage)
  .post("/images/producto/:id/adicional", AuthMiddleware(['productor', 'admin']), uploadProductAdditionalImage)
  .delete("/images/producto/:id/adicional/:index", AuthMiddleware(['productor', 'admin']), deleteProductAdditionalImage)
  .post("/images/productor/perfil", AuthMiddleware(['consumidor', 'productor', 'admin']), uploadProductorProfileImage)
  .delete("/images/:path", AuthMiddleware(['admin']), deleteImage);










