import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";

const usuarioSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().min(7),
  direccion: z.string().min(3),
  id_ciudad: z.number().int().positive(),
  rol: z.enum(["admin", "consumidor", "productor"], {
    message: "El rol debe ser admin, consumidor o productor",
  }),
  // Campos opcionales de seguridad
  intentos_login: z.number().optional(),
  bloqueado_hasta: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  email_verificado: z.boolean().optional(),
  telefono_verificado: z.boolean().optional(),
  fecha_registro: z.string().optional(),
  ultimo_acceso: z.string().nullable().optional(),
});

const usuarioSchemaUpdate = usuarioSchema.extend({
  id_usuario: z.number().int().positive("El ID debe ser un numero positivo"),
});

export const getUsuarios = async (ctx: Context) => {
  try {
    const objUsuario = new Usuario();
    const lista = await objUsuario.ListarUsuarios();

    // ✅ Retornar 200 con lista vacía, no 404
    if (lista.length === 0) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "No se encontraron usuarios.",
        data: [],
        total: 0,
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: `${lista.length} usuarios encontrados.`,
      data: lista,
      total: lista.length,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Error interno del servidor.",
    };
  }
};

export const postUsuario = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = usuarioSchema.parse(body);

    const usuarioData = {
      id_usuario: null,
      ...validated,
      activo: validated.activo ?? true, // Por defecto activo si no se especifica
      email_verificado: validated.email_verificado ?? false, // Por defecto no verificado
    };

    const objUsuario = new Usuario(usuarioData);
    const result = await objUsuario.InsertarUsuario();

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
      data: result.usuario,
    };
  } catch (error) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : 
               error instanceof Error ? error.message : "Error al insertar el usuario.",
    };
  }
};

export const putUsuario = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const validated = usuarioSchemaUpdate.parse(body);

    const usuarioData = {
      ...validated,
      activo: validated.activo ?? true, // Por defecto activo si no se especifica
      email_verificado: validated.email_verificado ?? false, // Por defecto no verificado
    };

    const objUsuario = new Usuario(usuarioData);
    const result = await objUsuario.EditarUsuario();

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      message: error instanceof z.ZodError ? "Datos invalidos." : 
               error instanceof Error ? error.message : "Error al actualizar el usuario.",
    };
  }
};

export const deleteUsuario = async (ctx: RouterContext<"/Usuario/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de usuario invalido.",
      };
      return;
    }

    const objUsuario = new Usuario();
    const result = await objUsuario.EliminarUsuario(id_usuario);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor.",
    };
  }
};

export const filtrarUsuarios = async (ctx: Context) => {
  try {
    // TODO: Implementar filtros cuando se agreguen las funciones correspondientes
    // const ciudad = ctx.request.url.searchParams.get("ciudad");
    // const departamento = ctx.request.url.searchParams.get("departamento");
    // const region = ctx.request.url.searchParams.get("region");

    const objUsuario = new Usuario();
    const lista = await objUsuario.ListarUsuarios();

    ctx.response.status = lista.length > 0 ? 200 : 404;
    ctx.response.body = {
      success: lista.length > 0,
      message: lista.length > 0
        ? "Usuarios encontrados."
        : "No se encontraron usuarios.",
      data: lista,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: error instanceof Error ? error.message : "Error interno del servidor al filtrar usuarios.",
    };
  }
};

// 📌 Obtener mi perfil (usuario autenticado)
export const getMiPerfil = async (ctx: Context) => {
  try {
    const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
    
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "UNAUTHORIZED",
        message: "Usuario no autenticado"
      };
      return;
    }

    const objUsuario = new Usuario();
    const usuario = await objUsuario.ObtenerPorId(userId);

    if (!usuario) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Usuario no encontrado"
      };
      return;
    }

    // No devolver la contraseña
    const { password: _password, ...usuarioSinPassword } = usuario;

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Perfil obtenido correctamente",
      data: usuarioSinPassword
    };
  } catch (error) {
    console.error("Error en getMiPerfil:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Error interno del servidor"
    };
  }
};

// 📌 Actualizar mi perfil (usuario autenticado)
export const putMiPerfil = async (ctx: Context) => {
  try {
    const userId = ctx.state.user?.id || ctx.state.user?.id_usuario;
    
    console.log('👤 [putMiPerfil] Usuario autenticado:', {
      userId,
      userIdType: typeof userId,
      userState: ctx.state.user
    });
    
    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "UNAUTHORIZED",
        message: "Usuario no autenticado"
      };
      return;
    }

    // Asegurar que userId sea un número
    const userIdNum = Number(userId);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de usuario inválido"
      };
      return;
    }

    const body = await ctx.request.body.json();
    console.log('📝 [putMiPerfil] Body recibido:', JSON.stringify(body, null, 2));
    
    // Esquema para actualización de perfil (campos opcionales, sin password ni rol)
    // Preprocesar para convertir strings vacíos a undefined/null
    const perfilSchema = z.object({
      nombre: z.preprocess(
        (val) => (typeof val === 'string' && val.trim() === '') ? undefined : val,
        z.string().min(1).optional()
      ),
      email: z.preprocess(
        (val) => (typeof val === 'string' && val.trim() === '') ? undefined : val,
        z.string().email().optional()
      ),
      telefono: z.preprocess(
        (val) => (typeof val === 'string' && val.trim() === '') ? null : val,
        z.string().nullable().optional()
      ),
      direccion: z.preprocess(
        (val) => (typeof val === 'string' && val.trim() === '') ? null : val,
        z.string().nullable().optional()
      ),
      id_ciudad: z.number().int().positive().nullable().optional(),
      foto_perfil: z.string().nullable().optional(),
      activo: z.boolean().optional(),
    });

    let validated;
    try {
      validated = perfilSchema.parse(body);
      console.log('✅ [putMiPerfil] Datos validados:', validated);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('❌ [putMiPerfil] Error de validación Zod:', zodError.errors);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "DATOS_INVALIDOS",
          message: "Los datos proporcionados no son válidos",
          errors: zodError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
        return;
      }
      throw zodError;
    }

    // Obtener el usuario actual para mantener los campos que no se actualizan
    const objUsuario = new Usuario();
    const usuarioActual = await objUsuario.ObtenerPorId(userIdNum);

    if (!usuarioActual) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Usuario no encontrado"
      };
      return;
    }

    // Construir datos actualizados (solo los campos proporcionados)
    const usuarioData = {
      id_usuario: userIdNum,
      nombre: validated.nombre ?? usuarioActual.nombre,
      email: validated.email ?? usuarioActual.email,
      telefono: validated.telefono ?? usuarioActual.telefono,
      direccion: validated.direccion ?? usuarioActual.direccion,
      id_ciudad: validated.id_ciudad ?? usuarioActual.id_ciudad,
      foto_perfil: validated.foto_perfil !== undefined ? validated.foto_perfil : usuarioActual.foto_perfil,
      rol: usuarioActual.rol, // No se puede cambiar
      activo: validated.activo !== undefined ? validated.activo : usuarioActual.activo, // Permitir cambiar estado
      email_verificado: usuarioActual.email_verificado, // No se puede cambiar
      password: usuarioActual.password // Mantener la contraseña actual (no se actualiza desde aquí)
    };

    console.log('💾 [putMiPerfil] Datos para actualizar:', {
      id_usuario: usuarioData.id_usuario,
      nombre: usuarioData.nombre,
      email: usuarioData.email,
      telefono: usuarioData.telefono,
      direccion: usuarioData.direccion,
      id_ciudad: usuarioData.id_ciudad,
      foto_perfil: usuarioData.foto_perfil,
      rol: usuarioData.rol,
      activo: usuarioData.activo,
      email_verificado: usuarioData.email_verificado
    });

    const objUsuarioUpdate = new Usuario(usuarioData);
    const result = await objUsuarioUpdate.EditarUsuario();

    console.log('📊 [putMiPerfil] Resultado de EditarUsuario:', result);

    if (result.success) {
      // Obtener el usuario actualizado
      const usuarioActualizado = await objUsuario.ObtenerPorId(userIdNum);
      const { password: _password, ...usuarioSinPassword } = usuarioActualizado!;

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Perfil actualizado correctamente",
        data: usuarioSinPassword
      };
    } else {
      console.error('❌ [putMiPerfil] Error al actualizar:', result.message);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ERROR_ACTUALIZACION",
        message: result.message || "Error al actualizar el perfil"
      };
    }
  } catch (error) {
    console.error("Error en putMiPerfil:", error);
    if (error instanceof z.ZodError) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "DATOS_INVALIDOS",
        message: "Los datos proporcionados no son válidos",
        errors: error.errors
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Error interno del servidor"
      };
    }
  }
};

