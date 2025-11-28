import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { Resena } from "../Models/ReseñasModel.ts";

// 📌 Validaciones con Zod - Adaptado a la estructura de BD
// id_pedido e id_consumidor son opcionales - se obtienen automáticamente
const resenaSchema = z.object({
  id_pedido: z.number().int().positive().nullable().optional(),
  id_producto: z.number().int().positive(),
  id_consumidor: z.number().int().positive().optional(), // Se obtiene del usuario autenticado
  id_productor: z.number().int().positive().optional(), // Se obtiene del producto si no se proporciona
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().nullable().optional(),
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
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Debes estar autenticado para agregar una reseña.",
      };
      return;
    }

    const body = await ctx.request.body.json();
    
    // Log para debugging
    console.log("[ReseñasController] Datos recibidos:", JSON.stringify(body, null, 2));
    
    // Validar con Zod - usar safeParse para mejor manejo de errores
    const validationResult = resenaSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("[ReseñasController] Errores de validación:", validationResult.error.errors);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Datos inválidos.",
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
      return;
    }
    
    const validated = validationResult.data;
    console.log("[ReseñasController] Datos validados:", JSON.stringify(validated, null, 2));

    // Obtener id_productor del producto si no se proporciona
    let id_productor = validated.id_productor;
    if (!id_productor) {
      const { conexion } = await import("../Models/Conexion.ts");
      const [producto] = await conexion.query(
        "SELECT id_usuario FROM productos WHERE id_producto = ?",
        [validated.id_producto]
      ) as Array<{ id_usuario: number }>;
      
      if (!producto || !producto.id_usuario) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          message: "Producto no encontrado.",
        };
        return;
      }
      id_productor = producto.id_usuario;
    }

    // Verificar que el usuario no haya reseñado este producto antes
    const { conexion } = await import("../Models/Conexion.ts");
    const [resenaExistente] = await conexion.query(
      "SELECT id_resena FROM reseñas WHERE id_producto = ? AND id_consumidor = ?",
      [validated.id_producto, user.id]
    ) as Array<{ id_resena: number }>;

    if (resenaExistente) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Ya has reseñado este producto. Puedes editarla desde tu perfil.",
      };
      return;
    }

    const resenaData = {
      id_resena: null,
      id_pedido: validated.id_pedido || null,
      id_producto: validated.id_producto,
      id_consumidor: user.id, // Usar el ID del usuario autenticado
      id_productor: id_productor,
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
    console.error("[ReseñasController] Error al insertar reseña:", error);
    
    if (error instanceof z.ZodError) {
      console.error("[ReseñasController] Errores de validación:", error.errors);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Datos inválidos.",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
      return;
    }
    
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Error al insertar la reseña.",
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
        data: [],
        promedio: 0,
        total: 0
      };
      return;
    }

    const objResena = new Resena();
    const lista = await objResena.BuscarPorProducto(id_producto);
    const promedio = await objResena.obtenerPromedioCalificacion(id_producto);

    console.log(`[ReseñasController] getResenasByProducto - ID: ${id_producto}, Reseñas encontradas: ${lista.length}, Promedio: ${promedio.promedio}, Total: ${promedio.total}`);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: lista.length > 0 ? "Reseñas encontradas para el producto." : "No se encontraron reseñas para este producto.",
      data: Array.isArray(lista) ? lista : [],
      promedio: typeof promedio.promedio === 'number' ? promedio.promedio : 0,
      total: typeof promedio.total === 'number' ? promedio.total : 0
    };
  } catch (error) {
    console.error("[ReseñasController] Error al obtener reseñas por producto:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
      data: [],
      promedio: 0,
      total: 0
    };
  }
};

// 📌 Obtener promedio de calificaciones de un producto
export const getPromedioCalificacion = async (ctx: RouterContext<"/resenas/producto/:id/promedio">) => {
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
    const promedio = await objResena.obtenerPromedioCalificacion(id_producto);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: promedio
    };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};
