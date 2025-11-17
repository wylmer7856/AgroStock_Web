import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { CategoriasModel, CategoriaCreateData } from "../Models/CategoriasModel.ts";

export class CategoriasController {
  
  // 📌 Listar categorías activas
  static async ListarCategorias(ctx: Context) {
    try {
      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const categorias = await categoriaModel.ListarCategorias();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        categorias,
        total: categorias.length
      };
    } catch (error) {
      console.error("Error en ListarCategorias:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Listar todas las categorías (solo admin)
  static async ListarTodasLasCategorias(ctx: Context) {
    try {
      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const categorias = await categoriaModel.ListarTodasLasCategorias();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        categorias,
        total: categorias.length
      };
    } catch (error) {
      console.error("Error en ListarTodasLasCategorias:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Crear categoría (solo admin)
  static async CrearCategoria(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { nombre, descripcion, activa, imagen_url } = body;

      if (!nombre) {
        ctx.response.status = 400;
        ctx.response.body = { error: "El nombre de la categoría es requerido" };
        return;
      }

      let imagenPath: string | undefined = undefined;

      // Si imagen_url es base64, guardarlo como archivo
      if (imagen_url && (imagen_url.startsWith('data:image/') || imagen_url.length > 1000)) {
        try {
          const { imageService } = await import("../Services/ImageService.ts");
          const result = await imageService.saveImage(imagen_url, 'categorias');
          
          if (result.success && result.path) {
            imagenPath = result.path;
            console.log(`✅ Imagen de categoría guardada: ${imagenPath}`);
          } else {
            console.warn("⚠️ No se pudo guardar la imagen de categoría:", result.message);
          }
        } catch (imgError) {
          console.warn("⚠️ Error guardando imagen de categoría:", imgError);
        }
      } else if (imagen_url && (imagen_url.startsWith('http://') || imagen_url.startsWith('https://'))) {
        // Si es una URL, guardarla directamente
        imagenPath = imagen_url;
      } else if (imagen_url) {
        // Si es un path relativo, guardarlo
        imagenPath = imagen_url;
      }

      const categoriaData: CategoriaCreateData = {
        nombre,
        descripcion: descripcion || undefined,
        imagen_url: imagenPath,
        activa: activa !== false
      };

      const categoriaModel = new CategoriasModel(categoriaData);
      const result = await categoriaModel.CrearCategoria();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Actualizar categoría (solo admin)
  static async ActualizarCategoria(ctx: RouterContext<"/categorias/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;
      const body = await ctx.request.body.json();
      const { nombre, descripcion, activa, imagen_url } = body;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      // Obtener imagen anterior para eliminarla si es necesario
      const { conexion } = await import("../Models/Conexion.ts");
      const categoriaAnterior = await conexion.query(
        "SELECT imagen_url FROM categorias WHERE id_categoria = ?",
        [parseInt(id_categoria)]
      );
      const imagenAnterior = categoriaAnterior.length > 0 ? categoriaAnterior[0].imagen_url : null;

      let imagenPath: string | undefined = undefined;

      // Si imagen_url es base64, guardarlo como archivo
      if (imagen_url && (imagen_url.startsWith('data:image/') || imagen_url.length > 1000)) {
        try {
          const { imageService } = await import("../Services/ImageService.ts");
          const result = await imageService.saveImage(imagen_url, 'categorias');
          
          if (result.success && result.path) {
            imagenPath = result.path;
            console.log(`✅ Imagen de categoría guardada: ${imagenPath}`);
            
            // Eliminar imagen anterior si existe y es diferente
            if (imagenAnterior && imagenAnterior !== imagenPath && !imagenAnterior.startsWith('http')) {
              try {
                await imageService.deleteImage(imagenAnterior);
                console.log(`🗑️ Imagen anterior eliminada: ${imagenAnterior}`);
              } catch (deleteError) {
                console.warn("⚠️ Error eliminando imagen anterior:", deleteError);
              }
            }
          } else {
            console.warn("⚠️ No se pudo guardar la imagen de categoría:", result.message);
          }
        } catch (imgError) {
          console.warn("⚠️ Error guardando imagen de categoría:", imgError);
        }
      } else if (imagen_url && (imagen_url.startsWith('http://') || imagen_url.startsWith('https://'))) {
        // Si es una URL, guardarla directamente
        imagenPath = imagen_url;
      } else if (imagen_url) {
        // Si es un path relativo, guardarlo
        imagenPath = imagen_url;
      } else if (imagen_url === null || imagen_url === '') {
        // Si se envía null o string vacío, eliminar la imagen
        if (imagenAnterior && !imagenAnterior.startsWith('http')) {
          try {
            const { imageService } = await import("../Services/ImageService.ts");
            await imageService.deleteImage(imagenAnterior);
            console.log(`🗑️ Imagen de categoría eliminada: ${imagenAnterior}`);
          } catch (deleteError) {
            console.warn("⚠️ Error eliminando imagen:", deleteError);
          }
        }
        imagenPath = null;
      }

      const categoriaData: CategoriaCreateData = {
        nombre,
        descripcion: descripcion || undefined,
        imagen_url: imagenPath,
        activa: activa !== false
      };

      const categoriaModel = new CategoriasModel(categoriaData);
      const result = await categoriaModel.ActualizarCategoria(parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ActualizarCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar categoría (solo admin)
  static async EliminarCategoria(ctx: RouterContext<"/categorias/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const result = await categoriaModel.EliminarCategoria(parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener categoría por ID
  static async ObtenerCategoriaPorId(ctx: RouterContext<"/categorias/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const categoria = await categoriaModel.ObtenerCategoriaPorId(parseInt(id_categoria));

      if (categoria) {
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          categoria
        };
      } else {
        ctx.response.status = 404;
        ctx.response.body = { error: "Categoría no encontrada" };
      }
    } catch (error) {
      console.error("Error en ObtenerCategoriaPorId:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Asociar producto con categoría
  static async AsociarProductoCategoria(ctx: RouterContext<"/categorias/:id_categoria/productos/:id_producto">) {
    try {
      const { id_producto, id_categoria } = ctx.params;

      if (!id_producto || !id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto y categoría requeridos" };
        return;
      }

      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const result = await categoriaModel.AsociarProductoCategoria(parseInt(id_producto), parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en AsociarProductoCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Desasociar producto de categoría
  static async DesasociarProductoCategoria(ctx: RouterContext<"/categorias/:id_categoria/productos/:id_producto">) {
    try {
      const { id_producto, id_categoria } = ctx.params;

      if (!id_producto || !id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto y categoría requeridos" };
        return;
      }

      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const result = await categoriaModel.DesasociarProductoCategoria(parseInt(id_producto), parseInt(id_categoria));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en DesasociarProductoCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener categorías de un producto
  static async ObtenerCategoriasDeProducto(ctx: RouterContext<"/productos/:id_producto/categorias">) {
    try {
      const { id_producto } = ctx.params;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del producto requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const categorias = await categoriaModel.ObtenerCategoriasDeProducto(parseInt(id_producto));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        categorias,
        total: categorias.length
      };
    } catch (error) {
      console.error("Error en ObtenerCategoriasDeProducto:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener productos por categoría
  static async ObtenerProductosPorCategoria(ctx: RouterContext<"/categorias/:id_categoria/productos">) {
    try {
      const { id_categoria } = ctx.params;

      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID de la categoría requerido" };
        return;
      }

      const categoriaModel = new CategoriasModel({} as CategoriaCreateData);
      const productos = await categoriaModel.ObtenerProductosPorCategoria(parseInt(id_categoria));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        productos,
        total: productos.length
      };
    } catch (error) {
      console.error("Error en ObtenerProductosPorCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
