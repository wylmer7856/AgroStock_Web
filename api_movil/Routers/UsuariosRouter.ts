import { Router } from "../Dependencies/dependencias.ts";
import {
  getUsuarios,
  postUsuario,
  putUsuario,
  deleteUsuario,
  getMiPerfil,
  putMiPerfil,
} from "../Controller/UsuariosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const UsuariosRouter = new Router();

// Solo el rol 'admin' puede acceder a estas rutas
UsuariosRouter
  .get("/Usuario", AuthMiddleware(["admin"]), getUsuarios)          // Listar usuarios
  .post("/Usuario", AuthMiddleware(["admin"]), postUsuario)         // Crear usuario
  .put("/Usuario", AuthMiddleware(["admin"]), putUsuario)           // Editar usuario
  .delete("/Usuario/:id", AuthMiddleware(["admin"]), deleteUsuario) // Eliminar usuario por ID

// Rutas para que cualquier usuario autenticado pueda gestionar su propio perfil
UsuariosRouter
  .get("/usuarios/mi-perfil", AuthMiddleware(['consumidor', 'productor', 'admin']), getMiPerfil)  // Obtener mi perfil
  .put("/usuarios/mi-perfil", AuthMiddleware(['consumidor', 'productor', 'admin']), putMiPerfil)  // Actualizar mi perfil

// Rutas adicionales pueden agregarse aquí cuando se implementen las funciones correspondientes

export { UsuariosRouter };
