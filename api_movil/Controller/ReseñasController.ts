import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { Resena } from "../Models/ReseñasModel.ts";

// 📌 Validaciones con Zod - Adaptado a la estructura de BD
const resenaSchema = z.object({
  id_pedido: z.number().int().positive(),
  id_producto: z.number().int().positive(),
  id_consumidor: z.number().int().positive(),
  id_productor: z.number().int().positive(),
  calificacion: z.number().min(1).max(5),
  comentario: z.string().optional().nullable(),
});

const resenaSchemaUpdate = z.object({
  id_resena: z.number().int().positive("El ID debe ser un número positivo"),
  calificacion: z.number().min(1).max(5).optional(),
  comentario: z.string().optional().nullable(),
});

// 📌 Listar reseñas
export const getResenas = async (ctx: Context) => {
  try {
    const objResena = new Resena();
    const lista = await objResena.ListarResenas();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Reseñas encontradas." : "No se encontraron reseñas.",
      data: lista,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Insertar reseña
export const postResena = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = resenaSchema.parse(body);

    const resenaData = {
      id_resena: null,
      id_pedido: validated.id_pedido,
      id_producto: validated.id_producto,
      id_consumidor: validated.id_consumidor,
      id_productor: validated.id_productor,
      calificacion: validated.calificacion,
      comentario: validated.comentario || null,
      fecha_resena: null, // Se establece automáticamente por la BD
    };

    const objResena = new Resena(resenaData);
    const result = await objResena.InsertarResena();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.resena,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al insertar la reseña.",
    };
  }
};

// 📌 Editar reseña
export const putResena = async (ctx: RouterContext<"/resenas/:id">) => {
  try {
    const body = await ctx.request.body.json();
    const validated = resenaSchemaUpdate.parse(body);
    
    // Obtener el ID de la URL si no viene en el body
    const id_resena = validated.id_resena || Number(ctx.params.id);
    
    // Crear objeto parcial con solo los campos necesarios para edición
    // El método EditarResena solo necesita id_resena, calificacion y comentario
    const resenaData = {
      id_resena: id_resena,
      id_pedido: 0, // No se usa en EditarResena, pero requerido por el tipo
      id_producto: 0, // No se usa en EditarResena, pero requerido por el tipo
      id_consumidor: 0, // No se usa en EditarResena, pero requerido por el tipo
      id_productor: 0, // No se usa en EditarResena, pero requerido por el tipo
      calificacion: validated.calificacion ?? 0, // Valor por defecto si no se proporciona
      comentario: validated.comentario ?? null,
      fecha_resena: null, // No se usa en EditarResena
    };

    const objResena = new Resena(resenaData);
    const result = await objResena.EditarResena();

    ctx.response.status = result.success ? 200 : 400;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos inválidos." : "Error al actualizar la reseña.",
    };
  }
};

// 📌 Eliminar reseña
export const deleteResena = async (ctx: RouterContext<"/resenas/:id">) => {
  try {
    const id_resena = Number(ctx.params.id);
    if (isNaN(id_resena) || id_resena <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de reseña inválido.",
      };
      return;
    }

    const objResena = new Resena();
    const result = await objResena.EliminarResena(id_resena);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Buscar reseñas de un producto
export const getResenasByProducto = async (ctx: RouterContext<"/resenas/producto/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de producto inválido.",
      };
      return;
    }

    const objResena = new Resena();
    const lista = await objResena.BuscarPorProducto(id_producto);

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0 ? "Reseñas encontradas para el producto." : "No se encontraron reseñas para este producto.",
      data: lista,
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
