import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { CiudadesModel } from "../Models/CiudadesModel.ts";

export const getCiudades = async (ctx: Context) => {
  try {
    const model = new CiudadesModel();
    const lista = await model.ListarCiudades();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Ciudades encontradas." : "No se encontraron ciudades.",
      data: lista,
    };
  } catch (error) {
    console.error("Error en getCiudades:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getCiudadPorId = async (ctx: RouterContext<"/ciudades/:id">) => {
  try {
    const id_ciudad = Number(ctx.params.id);
    
    if (isNaN(id_ciudad) || id_ciudad <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de ciudad inválido.",
      };
      return;
    }

    const { conexion } = await import("../Models/Conexion.ts");
    const result = await conexion.query(
      "SELECT * FROM ciudades WHERE id_ciudad = ?",
      [id_ciudad]
    );

    if (result.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Ciudad no encontrada.",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Ciudad encontrada.",
      data: result[0],
    };
  } catch (error) {
    console.error("Error en getCiudadPorId:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};