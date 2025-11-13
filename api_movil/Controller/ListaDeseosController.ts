import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { ListaDeseosModel, ListaDeseoCreateData } from "../Models/ListaDeseosModel.ts";

export class ListaDeseosController {
  
  // 📌 Obtener lista de deseos del usuario autenticado
  static async ObtenerMiListaDeseos(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const listaDeseosModel = new ListaDeseosModel({} as ListaDeseoCreateData);
      const listaDeseos = await listaDeseosModel.ObtenerListaDeseosPorUsuario(user.id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        listaDeseos,
        total: listaDeseos.length
      };
    } catch (error) {
      console.error("Error en ObtenerMiListaDeseos:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Agregar producto a lista de deseos
  static async AgregarAListaDeseos(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const body = await ctx.request.body.json();
      const { id_producto } = body;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID del producto requerido" };
        return;
      }

      const listaDeseoData: ListaDeseoCreateData = {
        id_usuario: user.id,
        id_producto
      };

      const listaDeseosModel = new ListaDeseosModel(listaDeseoData);
      const result = await listaDeseosModel.AgregarAListaDeseos();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en AgregarAListaDeseos:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar producto de lista de deseos por ID de lista
  static async EliminarDeListaDeseos(ctx: RouterContext<"/lista-deseos/:id_lista">) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const { id_lista } = ctx.params;

      if (!id_lista) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID de lista requerido" };
        return;
      }

      const listaDeseosModel = new ListaDeseosModel({} as ListaDeseoCreateData);
      const result = await listaDeseosModel.EliminarDeListaDeseos(parseInt(id_lista), user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarDeListaDeseos:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar producto de lista de deseos por ID de producto
  static async EliminarProductoDeListaDeseos(ctx: RouterContext<"/lista-deseos/producto/:id_producto">) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const { id_producto } = ctx.params;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID del producto requerido" };
        return;
      }

      const listaDeseosModel = new ListaDeseosModel({} as ListaDeseoCreateData);
      const result = await listaDeseosModel.EliminarProductoDeListaDeseos(parseInt(id_producto), user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarProductoDeListaDeseos:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Limpiar toda la lista de deseos
  static async LimpiarListaDeseos(ctx: Context) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const listaDeseosModel = new ListaDeseosModel({} as ListaDeseoCreateData);
      const result = await listaDeseosModel.LimpiarListaDeseos(user.id);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en LimpiarListaDeseos:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }

  // 📌 Verificar si un producto está en la lista de deseos
  static async VerificarProductoEnLista(ctx: RouterContext<"/lista-deseos/producto/:id_producto/verificar">) {
    try {
      const user = ctx.state.user;
      if (!user || !user.id) {
        ctx.response.status = 401;
        ctx.response.body = { success: false, error: "No autenticado" };
        return;
      }

      const { id_producto } = ctx.params;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "ID del producto requerido" };
        return;
      }

      const listaDeseosModel = new ListaDeseosModel({} as ListaDeseoCreateData);
      const estaEnLista = await listaDeseosModel.VerificarProductoEnLista(parseInt(id_producto), user.id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estaEnLista
      };
    } catch (error) {
      console.error("Error en VerificarProductoEnLista:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "Error interno del servidor" };
    }
  }
}






