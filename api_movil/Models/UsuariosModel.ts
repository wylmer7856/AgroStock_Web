import { conexion } from "./Conexion.ts";

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
      return result.map((row: any) => ({
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
  public async EliminarUsuario(id_usuario: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Usuario eliminado correctamente.",
        };
      } else {
        throw new Error("No se encontro el usuario a eliminar.");
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
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

      // Si hay password, actualizarlo, si no, mantener el actual
      let query = "UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, direccion = ?, id_ciudad = ?, rol = ?, activo = ?, email_verificado = ?";
      let params: any[] = [nombre, email, telefono || null, direccion || null, id_ciudad || null, rol, activo !== false ? 1 : 0, email_verificado ? 1 : 0];
      
      if (password) {
        query += ", password = ?";
        params.push(password);
      }
      
      if (foto_perfil !== undefined) {
        query += ", foto_perfil = ?";
        params.push(foto_perfil || null);
      }
      
      query += " WHERE id_usuario = ?";
      params.push(idUsuarioNum);

      console.log('📝 [UsuariosModel.EditarUsuario] Query:', query);
      console.log('📝 [UsuariosModel.EditarUsuario] Params:', params.map((p, i) => i === params.length - 1 ? p : (typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)));

      // Verificar que el usuario existe antes de actualizar
      const usuarioExiste = await conexion.query(
        "SELECT id_usuario, nombre, email, telefono, direccion, id_ciudad, rol, activo, email_verificado, foto_perfil FROM usuarios WHERE id_usuario = ?",
        [idUsuarioNum]
      );
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

      // Verificar si hay cambios reales
      const usuarioActual = usuarioExiste[0];
      const hayCambios = 
        usuarioActual.nombre !== nombre ||
        usuarioActual.email !== email ||
        (usuarioActual.telefono || null) !== (telefono || null) ||
        (usuarioActual.direccion || null) !== (direccion || null) ||
        (usuarioActual.id_ciudad || null) !== (id_ciudad || null) ||
        usuarioActual.rol !== rol ||
        usuarioActual.activo !== (activo !== false ? 1 : 0) ||
        usuarioActual.email_verificado !== (email_verificado ? 1 : 0) ||
        (foto_perfil !== undefined && (usuarioActual.foto_perfil || null) !== (foto_perfil || null));

      console.log('🔄 [UsuariosModel.EditarUsuario] ¿Hay cambios?', hayCambios);

      const result = await conexion.execute(query, params);

      console.log('📊 [UsuariosModel.EditarUsuario] Resultado:', {
        affectedRows: result?.affectedRows,
        insertId: result?.insertId,
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
        const user = result[0] as any;
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
      const row = result[0] as any;
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
