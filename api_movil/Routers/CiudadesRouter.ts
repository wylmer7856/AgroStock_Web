import { Router } from "../Dependencies/dependencias.ts";
import { getCiudades, getCiudadPorId } from "../Controller/CiudadesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const CiudadesRouter = new Router();

// Ruta pública para ciudades (necesaria para registro)
CiudadesRouter.get("/ciudades", getCiudades);
CiudadesRouter.get("/ciudades/:id", getCiudadPorId);

export { CiudadesRouter };
