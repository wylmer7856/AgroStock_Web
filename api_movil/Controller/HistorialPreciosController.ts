import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { HistorialPreciosModel, HistorialPrecioCreateData } from "../Models/HistorialPreciosModel.ts";

export class HistorialPreciosController {
  
  // 📌 Obtener historial de precios de un producto
  static async ObtenerHistorialPorProducto(ctx: RouterContext<"/historial-precios/producto/:id_producto">) {
    try {
      const { id_producto } = ctx.params;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID del producto requerido" };
        return;
      }

      const historialModel = new HistorialPreciosModel({} as HistorialPrecioCreateData);
      const historial = await historialModel.ObtenerHistorialPorProducto(parseInt(id_producto));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        historial,
        total: historial.length
      };
    } catch (error) {
      console.error("Error en ObtenerHistorialPorProducto:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Listar historial de precios (con límite)
  static async ListarHistorialPrecios(ctx: Context) {
    try {
      const url = new URL(ctx.request.url);
      const limit = parseInt(url.searchParams.get("limit") || "100");

      const historialModel = new HistorialPreciosModel({} as HistorialPrecioCreateData);
      const historial = await historialModel.ListarHistorialPrecios(limit);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        historial,
        total: historial.length
      };
    } catch (error) {
      console.error("Error en ListarHistorialPrecios:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener último precio de un producto
  static async ObtenerUltimoPrecio(ctx: RouterContext<"/historial-precios/producto/:id_producto/ultimo">) {
    try {
      const { id_producto } = ctx.params;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID del producto requerido" };
        return;
      }

      const historialModel = new HistorialPreciosModel({} as HistorialPrecioCreateData);
      const ultimoPrecio = await historialModel.ObtenerUltimoPrecio(parseInt(id_producto));

      if (ultimoPrecio) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          ultimoPrecio
        };
      } else {
        ctx.response.status = 404;
        ctx.response.body = { success: false, error: "No se encontró historial de precios para este producto" };
      }
    } catch (error) {
      console.error("Error en ObtenerUltimoPrecio:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }
}






