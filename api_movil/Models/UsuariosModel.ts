import { conexion } from "./Conexion.ts";

// Tipo para filas de base de datos
interface UsuarioRow {
  id_usuario: number;
  nombre: string;
  email: string;
  password: string;
  telefono: string | null;
  direccion: string | null;
  id_ciudad: number | null;
  rol: 'admin' | 'consumidor' | 'productor';
  activo: number | boolean;
  email_verificado: number | boolean;
  foto_perfil?: string | null;
  fecha_registro?: string | null;
  ultimo_acceso?: string | null;
  [key: string]: unknown; // Para campos adicionales de JOINs
}

// Tipo para productos
interface ProductoRow {
  id_producto: number;
  imagen_principal?: string | null;
  imagenes_adicionales?: string | null;
  [key: string]: unknown;
}

// Tipo para pedidos
interface PedidoRow {
  id_pedido: number;
  [key: string]: unknown;
}

interface UsuarioData {
  id_usuario: number | null;
  nombre: string;
  email: string;
  password: string;
  telefono: string | null;
  direccion: string | null;
  id_ciudad: number | null;
  rol: 'admin' | 'consumidor' | 'productor';
  activo: boolean;
  email_verificado: boolean;
  foto_perfil?: string | null;
  fecha_registro?: string | null;
  ultimo_acceso?: string | null;
}

// Interfaz específica para login con todas las propiedades garantizadas
export interface UsuarioLoginData {
  id_usuario: number | null;
  nombre: string;
  email: string;
  password: string;
  telefono: string | null;
  direccion: string | null;
  id_ciudad: number | null;
  rol: 'admin' | 'consumidor' | 'productor';
  activo: boolean;
  email_verificado: boolean;
  foto_perfil: string | null;
  fecha_registro: string | null;
  ultimo_acceso: string | null;
}

export class Usuario {
  public _objUsuario: UsuarioData | null;

  constructor(objUsuario: UsuarioData | null = null) {
    this._objUsuario = objUsuario;
  }

  // 📌 Listar todos los usuarios
  public async ListarUsuarios(): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query("SELECT * FROM usuarios");
      if (!result || result.length === 0) {
        return [];
      }
      // Transformar los datos para asegurar el formato correcto
      return result.map((row: UsuarioRow) => ({
        id_usuario: row.id_usuario,
        nombre: row.nombre,
        email: row.email,
        password: row.password, // ⚠️ No debería enviarse al frontend, pero se mantiene para compatibilidad
        telefono: row.telefono,
        direccion: row.direccion,
        id_ciudad: row.id_ciudad,
        rol: row.rol,
        activo: row.activo !== 0,
        email_verificado: row.email_verificado !== 0,
        foto_perfil: row.foto_perfil || null,
        fecha_registro: row.fecha_registro || null,
        ultimo_acceso: row.ultimo_acceso || null
      })) as UsuarioData[];
    } catch (error) {
      console.error("Error al consultar los usuarios: ", error);
      throw new Error("No se pudieron obtener los usuarios.");
    }
  }

  // 📌 Insertar usuario
  public async InsertarUsuario(): Promise<{ success: boolean; message: string; usuario?: Record<string, unknown> }> {
    try {
      if (!this._objUsuario) {
        throw new Error("No se ha proporcionado un objeto valido.");
      }

      const { nombre, email, password, telefono, direccion, id_ciudad, rol } = this._objUsuario;

      if (!nombre || !email || !password || !telefono || !direccion || !id_ciudad || !rol) {
        throw new Error("Faltan campos requeridos para insertar usuario.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(
        "INSERT INTO usuarios (nombre, email, password, telefono, direccion, id_ciudad, rol, activo, email_verificado) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)",
        [nombre, email, password, telefono || null, direccion || null, id_ciudad || null, rol]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const [usuario] = await conexion.query("SELECT * FROM usuarios ORDER BY id_usuario DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Usuario insertado con exito.",
          usuario: usuario,
        };
      } else {
        throw new Error("No se pudo insertar el usuario.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Eliminar usuario
  public async EliminarUsuario(id_usuario: number): Promise<{ success: boolean; message: string; detalles?: Record<string, number> }> {
    try {
      await conexion.execute("START TRANSACTION");

      const detalles: Record<string, number> = {};

      // 1. Obtener foto_perfil antes de eliminar para borrar la imagen
      const usuario = await conexion.query("SELECT foto_perfil FROM usuarios WHERE id_usuario = ?", [id_usuario]);
      const fotoPerfil = usuario.length > 0 ? usuario[0].foto_perfil : null;

      // 2. Eliminar imágenes del usuario si existe foto_perfil
      if (fotoPerfil) {
        try {
          const { imageService } = await import("../Services/ImageService.ts");
          const userFolder = `usuarios/${id_usuario}`;
          await imageService.deleteFolder(userFolder);
          console.log(`🗑️ Carpeta de imágenes del usuario eliminada: ${userFolder}`);
        } catch (imgError) {
          console.warn("⚠️ Error eliminando imágenes del usuario:", imgError);
        }
      }

      // 3. Obtener productos del usuario antes de eliminarlos
      let productos: ProductoRow[] = [];
      let idsProductos: number[] = [];
      try {
        productos = await conexion.query("SELECT id_producto, imagen_principal, imagenes_adicionales FROM productos WHERE id_usuario = ?", [id_usuario]) as ProductoRow[];
        idsProductos = productos.map((p: ProductoRow) => p.id_producto);
      } catch (error: unknown) {
        console.warn("⚠️ Error obteniendo productos del usuario (tabla puede no existir):", error instanceof Error ? error.message : String(error));
        productos = [];
        idsProductos = [];
      }
      
      // 3.1. Eliminar historial de precios de productos del usuario (antes de eliminar productos)
      if (idsProductos.length > 0) {
        const placeholders = idsProductos.map(() => '?').join(',');
        try {
          const historialPrecios = await conexion.execute(
            `DELETE FROM historial_precios WHERE id_producto IN (${placeholders})`,
            idsProductos
          );
          detalles.historial_precios = historialPrecios?.affectedRows || 0;
        } catch (error: unknown) {
          console.warn("⚠️ Error eliminando historial_precios:", error instanceof Error ? error.message : String(error));
          detalles.historial_precios = 0;
        }
        
        // 3.2. Eliminar alertas de stock relacionadas
        try {
          const alertas = await conexion.execute(
            `DELETE FROM alertas_stock WHERE id_producto IN (${placeholders})`,
            idsProductos
          );
          detalles.alertas = alertas?.affectedRows || 0;
        } catch (error: unknown) {
          console.warn("⚠️ Error eliminando alertas_stock:", error instanceof Error ? error.message : String(error));
          detalles.alertas = 0;
        }
      } else {
        detalles.historial_precios = 0;
        detalles.alertas = 0;
      }
      
      // 3.3. Eliminar imágenes de productos
      if (productos.length > 0) {
        try {
          const { imageService } = await import("../Services/ImageService.ts");
          for (const producto of productos) {
            if (producto.imagen_principal) {
              await imageService.deleteImage(producto.imagen_principal);
            }
            if (producto.imagenes_adicionales) {
              const imagenes = JSON.parse(producto.imagenes_adicionales);
              for (const img of imagenes) {
                await imageService.deleteImage(img);
              }
            }
          }
        } catch (imgError) {
          console.warn("⚠️ Error eliminando imágenes de productos:", imgError);
        }
      }
      
      // 3.4. Eliminar productos del usuario
      try {
        const productosEliminados = await conexion.execute("DELETE FROM productos WHERE id_usuario = ?", [id_usuario]);
        detalles.productos = productosEliminados?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando productos:", error instanceof Error ? error.message : String(error));
        detalles.productos = 0;
      }

      // 4. Obtener IDs de pedidos relacionados antes de eliminarlos
      let idsPedidos: number[] = [];
      try {
        const pedidosIds = await conexion.query(
          "SELECT id_pedido FROM pedidos WHERE id_consumidor = ? OR id_productor = ?",
          [id_usuario, id_usuario]
        );
        idsPedidos = (pedidosIds as PedidoRow[]).map((p: PedidoRow) => p.id_pedido);
      } catch (error: unknown) {
        console.warn("⚠️ Error obteniendo pedidos del usuario (tabla puede no existir):", error instanceof Error ? error.message : String(error));
        idsPedidos = [];
      }

      // 5. Eliminar detalles de pedidos relacionados primero
      if (idsPedidos.length > 0) {
        const placeholders = idsPedidos.map(() => '?').join(',');
        try {
          const detallePedidos = await conexion.execute(
            `DELETE FROM detalle_pedidos WHERE id_pedido IN (${placeholders})`,
            idsPedidos
          );
          detalles.detalle_pedidos = detallePedidos?.affectedRows || 0;
        } catch (error: unknown) {
          console.warn("⚠️ Error eliminando detalle_pedidos:", error instanceof Error ? error.message : String(error));
          detalles.detalle_pedidos = 0;
        }
      } else {
        detalles.detalle_pedidos = 0;
      }

      // 6. Eliminar pedidos relacionados (como consumidor y como productor)
      try {
        const pedidosConsumidor = await conexion.execute("DELETE FROM pedidos WHERE id_consumidor = ?", [id_usuario]);
        detalles.pedidos_consumidor = pedidosConsumidor?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando pedidos (consumidor):", error instanceof Error ? error.message : String(error));
        detalles.pedidos_consumidor = 0;
      }
      
      try {
        const pedidosProductor = await conexion.execute("DELETE FROM pedidos WHERE id_productor = ?", [id_usuario]);
        detalles.pedidos_productor = pedidosProductor?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando pedidos (productor):", error instanceof Error ? error.message : String(error));
        detalles.pedidos_productor = 0;
      }

      // 7. Eliminar carrito de compras
      try {
        const carrito = await conexion.execute("DELETE FROM carrito WHERE id_usuario = ?", [id_usuario]);
        detalles.carrito = carrito?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando carrito:", error instanceof Error ? error.message : String(error));
        detalles.carrito = 0;
      }

      // 8. Eliminar mensajes (como remitente y destinatario)
      try {
        const mensajesRemitente = await conexion.execute("DELETE FROM mensajes WHERE id_remitente = ?", [id_usuario]);
        detalles.mensajes_remitente = mensajesRemitente?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando mensajes (remitente):", error instanceof Error ? error.message : String(error));
        detalles.mensajes_remitente = 0;
      }
      
      try {
        const mensajesDestinatario = await conexion.execute("DELETE FROM mensajes WHERE id_destinatario = ?", [id_usuario]);
        detalles.mensajes_destinatario = mensajesDestinatario?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando mensajes (destinatario):", error instanceof Error ? error.message : String(error));
        detalles.mensajes_destinatario = 0;
      }

      // 9. Eliminar notificaciones
      try {
        const notificaciones = await conexion.execute("DELETE FROM notificaciones WHERE id_usuario = ?", [id_usuario]);
        detalles.notificaciones = notificaciones?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando notificaciones:", error instanceof Error ? error.message : String(error));
        detalles.notificaciones = 0;
      }

      // 10. Eliminar lista de deseos
      try {
        const listaDeseos = await conexion.execute("DELETE FROM lista_deseos WHERE id_usuario = ?", [id_usuario]);
        detalles.lista_deseos = listaDeseos?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando lista_deseos:", error instanceof Error ? error.message : String(error));
        detalles.lista_deseos = 0;
      }

      // 11. Eliminar reseñas (como consumidor y como productor)
      try {
        const reseñasConsumidor = await conexion.execute("DELETE FROM reseñas WHERE id_consumidor = ?", [id_usuario]);
        detalles.reseñas_consumidor = reseñasConsumidor?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando reseñas (consumidor):", error instanceof Error ? error.message : String(error));
        detalles.reseñas_consumidor = 0;
      }
      
      try {
        const reseñasProductor = await conexion.execute("DELETE FROM reseñas WHERE id_productor = ?", [id_usuario]);
        detalles.reseñas_productor = reseñasProductor?.affectedRows || 0;
      } catch (error: unknown) {
        console.warn("⚠️ Error eliminando reseñas (productor):", error instanceof Error ? error.message : String(error));
        detalles.reseñas_productor = 0;
      }

      // 12. Eliminar estadísticas del usuario (si la tabla existe)
      try {
        const estadisticas = await conexion.execute("DELETE FROM estadisticas_usuarios WHERE id_usuario = ?", [id_usuario]);
        detalles.estadisticas = estadisticas?.affectedRows || 0;
      } catch (error: unknown) {
        // Si la tabla no existe o hay cualquier error, simplemente continuar
        console.warn("⚠️ Error eliminando estadisticas_usuarios (tabla puede no existir):", error instanceof Error ? error.message : String(error));
        detalles.estadisticas = 0;
      }

      // 15. Finalmente, eliminar el usuario
      const result = await conexion.execute("DELETE FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        console.log(`✅ Usuario ${id_usuario} eliminado completamente. Detalles:`, detalles);
        return {
          success: true,
          message: "Usuario y todos sus datos relacionados eliminados correctamente.",
          detalles
        };
      } else {
        throw new Error("No se encontro el usuario a eliminar.");
      }
    } catch (error: any) {
      await conexion.execute("ROLLBACK");
      console.error("❌ Error eliminando usuario:", error);
      
      // Si el error es sobre una tabla que no existe, intentar eliminar solo el usuario
      if (error?.message?.includes("doesn't exist")) {
        console.warn("⚠️ Algunas tablas no existen, intentando eliminar solo el usuario...");
        try {
          await conexion.execute("START TRANSACTION");
          const result = await conexion.execute("DELETE FROM usuarios WHERE id_usuario = ?", [id_usuario]);
          if (result && result.affectedRows && result.affectedRows > 0) {
            await conexion.execute("COMMIT");
            return {
              success: true,
              message: "Usuario eliminado. Algunas tablas relacionadas no existen en la base de datos.",
              detalles: {}
            };
          }
        } catch (fallbackError: unknown) {
          await conexion.execute("ROLLBACK");
          console.error("❌ Error en eliminación de respaldo:", fallbackError);
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Editar usuario
  public async EditarUsuario(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objUsuario || !this._objUsuario.id_usuario) {
        throw new Error("No se ha proporcionado un usuario valido con ID.");
      }

      const { id_usuario, nombre, email, password, telefono, direccion, id_ciudad, rol, activo, email_verificado, foto_perfil } = this._objUsuario;

      // Asegurar que id_usuario sea un número
      const idUsuarioNum = Number(id_usuario);
      if (isNaN(idUsuarioNum) || idUsuarioNum <= 0) {
        throw new Error(`ID de usuario inválido: ${id_usuario}`);
      }

      console.log('💾 [UsuariosModel.EditarUsuario] Datos recibidos:', {
        id_usuario: idUsuarioNum,
        id_usuario_original: id_usuario,
        nombre,
        email,
        telefono,
        direccion,
        id_ciudad,
        rol,
        activo,
        email_verificado,
        foto_perfil,
        hasPassword: !!password
      });

      await conexion.execute("START TRANSACTION");

      // ✅ Construir query dinámicamente solo con los campos que se proporcionan
      const updates: string[] = [];
      const params: (string | number | null)[] = [];

      // Campos siempre requeridos
      if (nombre !== undefined) {
        updates.push("nombre = ?");
        params.push(nombre);
      }
      if (email !== undefined) {
        updates.push("email = ?");
        params.push(email);
      }
      if (telefono !== undefined) {
        updates.push("telefono = ?");
        params.push(telefono || null);
      }
      if (direccion !== undefined) {
        updates.push("direccion = ?");
        params.push(direccion || null);
      }
      if (id_ciudad !== undefined) {
        updates.push("id_ciudad = ?");
        params.push(id_ciudad || null);
      }
      if (rol !== undefined) {
        updates.push("rol = ?");
        params.push(rol);
      }
      
      // ✅ Manejar activo correctamente: solo actualizar si se proporciona
      if (activo !== undefined) {
        updates.push("activo = ?");
        // activo es boolean, convertir a 1 o 0 para MySQL
        params.push(activo ? 1 : 0);
      }
      
      // ✅ Manejar email_verificado correctamente: solo actualizar si se proporciona
      if (email_verificado !== undefined) {
        updates.push("email_verificado = ?");
        // email_verificado es boolean, convertir a 1 o 0 para MySQL
        params.push(email_verificado ? 1 : 0);
      }
      
      // ✅ Password solo si se proporciona
      if (password) {
        updates.push("password = ?");
        params.push(password);
      }
      
      // ✅ Foto de perfil solo si se proporciona
      if (foto_perfil !== undefined) {
        updates.push("foto_perfil = ?");
        params.push(foto_perfil || null);
      }
      
      if (updates.length === 0) {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se proporcionaron campos para actualizar."
        };
      }

      const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id_usuario = ?`;
      params.push(idUsuarioNum);

      console.log('📝 [UsuariosModel.EditarUsuario] Query:', query);
      console.log('📝 [UsuariosModel.EditarUsuario] Params:', params.map((p, i) => i === params.length - 1 ? p : (typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)));

      // Verificar que el usuario existe antes de actualizar
      const usuarioExiste = await conexion.query(
        "SELECT id_usuario, nombre, email, telefono, direccion, id_ciudad, rol, activo, email_verificado, foto_perfil FROM usuarios WHERE id_usuario = ?",
        [idUsuarioNum]
      ) as UsuarioRow[];
      console.log('🔍 [UsuariosModel.EditarUsuario] Usuario existe?', {
        id_usuario: idUsuarioNum,
        encontrado: usuarioExiste.length > 0,
        usuario: usuarioExiste[0] || null
      });

      if (usuarioExiste.length === 0) {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: `Usuario con ID ${idUsuarioNum} no encontrado en la base de datos.`
        };
      }

      // Verificar si hay cambios reales (solo para los campos que se están actualizando)
      const usuarioActual = usuarioExiste[0] as UsuarioRow;
      let hayCambios = false;
      
      if (nombre !== undefined && usuarioActual.nombre !== nombre) hayCambios = true;
      if (email !== undefined && usuarioActual.email !== email) hayCambios = true;
      if (telefono !== undefined && (usuarioActual.telefono || null) !== (telefono || null)) hayCambios = true;
      if (direccion !== undefined && (usuarioActual.direccion || null) !== (direccion || null)) hayCambios = true;
      if (id_ciudad !== undefined && (usuarioActual.id_ciudad || null) !== (id_ciudad || null)) hayCambios = true;
      if (rol !== undefined && usuarioActual.rol !== rol) hayCambios = true;
      if (activo !== undefined) {
        // Convertir valores de BD (pueden ser 0/1 o boolean) a boolean
        const activoActual = Boolean(usuarioActual.activo === 1 || usuarioActual.activo === true);
        // activo es boolean según la interfaz
        const activoNuevo = Boolean(activo);
        if (activoActual !== activoNuevo) hayCambios = true;
      }
      if (email_verificado !== undefined) {
        // Convertir valores de BD (pueden ser 0/1 o boolean) a boolean
        const emailVerificadoActual = Boolean(usuarioActual.email_verificado === 1 || usuarioActual.email_verificado === true);
        // email_verificado es boolean según la interfaz
        const emailVerificadoNuevo = Boolean(email_verificado);
        if (emailVerificadoActual !== emailVerificadoNuevo) hayCambios = true;
      }
      if (foto_perfil !== undefined && (usuarioActual.foto_perfil || null) !== (foto_perfil || null)) hayCambios = true;
      if (password) hayCambios = true; // Si hay password, siempre hay cambio

      console.log('🔄 [UsuariosModel.EditarUsuario] ¿Hay cambios?', hayCambios);

      const result = await conexion.execute(query, params);

      console.log('📊 [UsuariosModel.EditarUsuario] Resultado:', {
        affectedRows: result?.affectedRows,
        result: result
      });

      // MySQL puede retornar affectedRows: 0 si los valores no cambiaron
      // Pero si el usuario existe, consideramos la operación exitosa
      if (result) {
        await conexion.execute("COMMIT");
        if (result.affectedRows && result.affectedRows > 0) {
          return {
            success: true,
            message: "Usuario actualizado correctamente.",
          };
        } else if (usuarioExiste.length > 0) {
          // El usuario existe pero no hubo cambios (affectedRows = 0)
          // Esto es válido, los datos ya estaban actualizados
          console.log('ℹ️ [UsuariosModel.EditarUsuario] No hubo cambios, pero el usuario existe');
          return {
            success: true,
            message: "Usuario actualizado correctamente (sin cambios).",
          };
        } else {
          throw new Error("No se pudo actualizar el usuario o no se encontro.");
        }
      } else {
        throw new Error("No se pudo ejecutar la actualización.");
      }
    } catch (error) {
      console.error('❌ [UsuariosModel.EditarUsuario] Error:', error);
      await conexion.execute("ROLLBACK");
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      };
    }
  }

  // 📌 Buscar usuario por email (para login)
  public async buscarPorEmail(email: string): Promise<UsuarioLoginData | null> {
    try {
      const result = await conexion.query(`
        SELECT 
          id_usuario, nombre, email, password, telefono, direccion, id_ciudad, rol,
          COALESCE(activo, 1) as activo,
          COALESCE(email_verificado, 0) as email_verificado,
          foto_perfil,
          fecha_registro,
          ultimo_acceso
        FROM usuarios 
        WHERE email = ? 
        LIMIT 1
      `, [email]);
      if (result.length > 0) {
        const user = result[0] as UsuarioRow;
        return {
          id_usuario: user.id_usuario,
          nombre: user.nombre,
          email: user.email,
          password: user.password,
          telefono: user.telefono,
          direccion: user.direccion,
          id_ciudad: user.id_ciudad,
          rol: user.rol,
          activo: user.activo !== 0,
          email_verificado: user.email_verificado !== 0,
          foto_perfil: user.foto_perfil || null,
          fecha_registro: user.fecha_registro,
          ultimo_acceso: user.ultimo_acceso
        } as UsuarioLoginData;
      }
      return null;
    } catch (error) {
      console.error("Error al buscar usuario por email: ", error);
      return null;
    }
  }

  // 📌 Obtener usuario por ID
  public async ObtenerPorId(id_usuario: number): Promise<UsuarioData | null> {
    try {
      const result = await conexion.query("SELECT * FROM usuarios WHERE id_usuario = ?", [id_usuario]);
      if (result.length === 0) {
        return null;
      }
      const row = result[0] as UsuarioRow;
      return {
        id_usuario: row.id_usuario,
        nombre: row.nombre,
        email: row.email,
        password: row.password,
        telefono: row.telefono || null,
        direccion: row.direccion || null,
        id_ciudad: row.id_ciudad || null,
        rol: row.rol as 'admin' | 'consumidor' | 'productor',
        activo: row.activo !== 0,
        email_verificado: row.email_verificado !== 0,
        foto_perfil: row.foto_perfil || null,
        fecha_registro: row.fecha_registro || null,
        ultimo_acceso: row.ultimo_acceso || null
      };
    } catch (error) {
      console.error("Error al obtener usuario por ID: ", error);
      return null;
    }
  }

  // 📌 Filtrar usuarios por ciudad
  public async FiltrarPorCiudad(id_ciudad: number): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query("SELECT * FROM usuarios WHERE id_ciudad = ?", [id_ciudad]);
      return result as UsuarioData[];
    } catch (error) {
      console.error("Error al filtrar usuarios por ciudad: ", error);
      return [];
    }
  }

  // 📌 Filtrar usuarios por departamento
  public async FiltrarPorDepartamento(id_departamento: number): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query(
        `SELECT u.* 
         FROM usuarios u
         INNER JOIN ciudades c ON u.id_ciudad = c.id_ciudad
         WHERE c.id_departamento = ?`,
        [id_departamento]
      );
      return result as UsuarioData[];
    } catch (error) {
      console.error("Error al filtrar usuarios por departamento: ", error);
      return [];
    }
  }

  // 📌 Filtrar usuarios por región
  public async FiltrarPorRegion(id_region: number): Promise<UsuarioData[]> {
    try {
      const result = await conexion.query(
        `SELECT u.* 
         FROM usuarios u
         INNER JOIN ciudades c ON u.id_ciudad = c.id_ciudad
         INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
         WHERE d.id_region = ?`,
        [id_region]
      );
      return result as UsuarioData[];
    } catch (error) {
      console.error("Error al filtrar usuarios por región: ", error);
      return [];
    }
  }
}
