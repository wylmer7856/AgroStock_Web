import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";
import { ProductosModel } from "../Models/ProductosModel.ts";
import { ReportesModel, ReporteData } from "../Models/ReportesModel.ts";
import { EstadisticasModel } from "../Models/EstadisticasModel.ts";
import { PedidosModel } from "../Models/PedidosModel.ts";
import { CategoriasModel } from "../Models/CategoriasModel.ts";
import { MensajesModel } from "../Models/MensajesModel.ts";
import { Resena } from "../Models/ReseñasModel.ts";
import { NotificacionesModel } from "../Models/NotificacionesModel.ts";
import { conexion } from "../Models/Conexion.ts";

export class AdminController {
  
  // 📌 Obtener todos los usuarios
  static async ObtenerTodosLosUsuarios(ctx: Context) {
    try {
      const rol = ctx.request.url.searchParams.get('rol');
      const ciudad = ctx.request.url.searchParams.get('ciudad');
      const departamento = ctx.request.url.searchParams.get('departamento');
      const region = ctx.request.url.searchParams.get('region');
      const usuarioModel = new Usuario();

      let usuarios;
      if (rol) {
        usuarios = await usuarioModel.ListarUsuarios();
        usuarios = usuarios.filter(u => u.rol === rol);
      } else if (ciudad) {
        usuarios = await usuarioModel.FiltrarPorCiudad(parseInt(ciudad));
      } else if (departamento) {
        usuarios = await usuarioModel.FiltrarPorDepartamento(parseInt(departamento));
      } else if (region) {
        usuarios = await usuarioModel.FiltrarPorRegion(parseInt(region));
      } else {
        usuarios = await usuarioModel.ListarUsuarios();
      }

      // Obtener información adicional de cada usuario
      const { conexion } = await import("../Models/Conexion.ts");
      const usuariosConInfo = await Promise.all(usuarios.map(async (usuario) => {
        try {
          const ciudad = await conexion.query(`
            SELECT c.nombre as ciudad, d.nombre as departamento, r.nombre as region
            FROM ciudades c
            INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
            INNER JOIN regiones r ON d.id_region = r.id_region
            WHERE c.id_ciudad = ?
          `, [usuario.id_ciudad || usuario.id_ciudad]);

          const estadisticas = await conexion.query(`
            SELECT 
              COUNT(DISTINCT p.id_producto) as total_productos,
              COUNT(DISTINCT m.id_mensaje) as total_mensajes_recibidos,
              COUNT(DISTINCT ped.id_pedido) as total_pedidos_recibidos
            FROM usuarios u
            LEFT JOIN productos p ON u.id_usuario = p.id_usuario
            LEFT JOIN mensajes m ON u.id_usuario = m.id_destinatario
            LEFT JOIN pedidos ped ON u.id_usuario = ped.id_productor
            WHERE u.id_usuario = ?
          `, [usuario.id_usuario]);

          // ✅ Remover password antes de enviar al frontend
          const { password: _password, ...usuarioSinPassword } = usuario;
          return {
            ...usuarioSinPassword,
            ubicacion: ciudad[0] ? {
              ciudad: ciudad[0].ciudad,
              departamento: ciudad[0].departamento,
              region: ciudad[0].region
            } : null,
            estadisticas: estadisticas[0] || { total_productos: 0, total_mensajes_recibidos: 0, total_pedidos_recibidos: 0 }
          };
        } catch (err) {
          console.error(`Error procesando usuario ${usuario.id_usuario}:`, err);
          // ✅ Remover password antes de enviar al frontend
          const { password: _password, ...usuarioSinPassword } = usuario;
          return {
            ...usuarioSinPassword,
            ubicacion: null,
            estadisticas: { total_productos: 0, total_mensajes_recibidos: 0, total_pedidos_recibidos: 0 }
          };
        }
      }));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: usuariosConInfo, // ✅ Formato estándar con data
        usuarios: usuariosConInfo, // ✅ Mantener también para compatibilidad
        total: usuariosConInfo.length,
        message: `${usuariosConInfo.length} usuarios encontrados`
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosUsuarios:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Crear usuario manualmente
  static async CrearUsuario(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { nombre, email, password, telefono, direccion, id_ciudad, rol } = body;

      if (!nombre || !email || !password || !telefono || !direccion || !id_ciudad || !rol) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_FIELDS",
          message: "Faltan campos requeridos" 
        };
        return;
      }

      const rolesValidos = ['admin', 'consumidor', 'productor'];
      if (!rolesValidos.includes(rol)) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "INVALID_ROLE",
          message: "Rol inválido. Roles válidos: admin, consumidor, productor"
        };
        return;
      }

      // ✅ Hashear la contraseña antes de guardar
      const { securityService } = await import("../Services/SecurityService.ts");
      const hashedPassword = await securityService.hashPassword(password);

      const usuarioData = {
        id_usuario: null,
        nombre,
        email: email.toLowerCase().trim(),
        password: hashedPassword, // ✅ Usar contraseña hasheada
        telefono,
        direccion,
        id_ciudad: parseInt(id_ciudad),
        rol,
        activo: true,
        email_verificado: false
      };

      const usuarioModel = new Usuario(usuarioData);
      const result = await usuarioModel.InsertarUsuario();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Editar usuario
  static async EditarUsuario(ctx: RouterContext<"/admin/usuario/:id_usuario">) {
    try {
      const { id_usuario } = ctx.params;
      const body = await ctx.request.body.json();
      const { nombre, email, password, telefono, direccion, id_ciudad, rol, activo, email_verificado } = body;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del usuario requerido" 
        };
        return;
      }

      // Validar campos requeridos
      if (!nombre || !email) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_FIELDS",
          message: "Nombre y email son campos requeridos" 
        };
        return;
      }

      const rolesValidos = ['admin', 'consumidor', 'productor'];
      if (rol && !rolesValidos.includes(rol)) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "INVALID_ROLE",
          message: "Rol inválido. Roles válidos: admin, consumidor, productor" 
        };
        return;
      }

      // ✅ Hashear password si se proporciona y no está vacío
      let hashedPassword: string | undefined = undefined;
      if (password && password.trim() !== '') {
        const { securityService } = await import("../Services/SecurityService.ts");
        hashedPassword = await securityService.hashPassword(password);
      }

      // ✅ Manejar campos opcionales correctamente
      const usuarioData = {
        id_usuario: parseInt(id_usuario),
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword, // Solo incluir si se proporciona
        telefono: telefono ? telefono.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        id_ciudad: id_ciudad ? parseInt(id_ciudad) : null, // Permitir null si no se especifica
        rol: rol || undefined,
        activo: activo !== undefined ? (activo === true || activo === 1 || activo === 'true') : undefined, // Manejar boolean, number y string
        email_verificado: email_verificado !== undefined ? (email_verificado === true || email_verificado === 1 || email_verificado === 'true') : undefined
      };

      console.log('📝 [AdminController.EditarUsuario] Datos procesados:', {
        id_usuario: usuarioData.id_usuario,
        nombre: usuarioData.nombre,
        email: usuarioData.email,
        hasPassword: !!usuarioData.password,
        telefono: usuarioData.telefono,
        direccion: usuarioData.direccion,
        id_ciudad: usuarioData.id_ciudad,
        rol: usuarioData.rol,
        activo: usuarioData.activo,
        email_verificado: usuarioData.email_verificado
      });

      const usuarioModel = new Usuario(usuarioData);
      const result = await usuarioModel.EditarUsuario();

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EditarUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // 📌 Eliminar usuario
  static async EliminarUsuario(ctx: RouterContext<"/admin/usuario/:id_usuario">) {
    try {
      const { id_usuario } = ctx.params;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del usuario requerido" 
        };
        return;
      }

      const usuarioModel = new Usuario();
      const result = await usuarioModel.EliminarUsuario(parseInt(id_usuario));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error: any) {
      console.error("Error en EliminarUsuario:", error);
      
      // Si el error es sobre una tabla que no existe, intentar eliminar solo el usuario
      if (error?.message?.includes("doesn't exist")) {
        try {
          const { conexion } = await import("../Models/Conexion.ts");
          await conexion.execute("START TRANSACTION");
          const result = await conexion.execute("DELETE FROM usuarios WHERE id_usuario = ?", [parseInt(ctx.params.id_usuario)]);
          if (result && result.affectedRows && result.affectedRows > 0) {
            await conexion.execute("COMMIT");
            ctx.response.status = 200;
            ctx.response.body = {
              success: true,
              message: "Usuario eliminado. Algunas tablas relacionadas no existen en la base de datos.",
              detalles: {}
            };
            return;
          }
        } catch (fallbackError: any) {
          console.error("Error en eliminación de respaldo:", fallbackError);
        }
      }
      
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Error interno del servidor" 
      };
    }
  }

  // 📌 Obtener todos los productos
  static async ObtenerTodosLosProductos(ctx: Context) {
    try {
      const { conexion } = await import("../Models/Conexion.ts");
      
      const productos = await conexion.query(`
        SELECT 
          p.*,
          u.nombre as nombre_productor,
          u.email as email_productor,
          u.telefono as telefono_productor,
          c.nombre as ciudad_origen,
          d.nombre as departamento_origen,
          r.nombre as region_origen
        FROM productos p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
        INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
        INNER JOIN regiones r ON d.id_region = r.id_region
        ORDER BY p.id_producto DESC
      `);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: productos, // ✅ Formato estándar con data
        productos, // ✅ Mantener también para compatibilidad
        total: productos.length,
        message: `${productos.length} productos encontrados`
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosProductos:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Eliminar producto inapropiado
  static async EliminarProductoInapropiado(ctx: RouterContext<"/admin/producto/:id_producto">) {
    try {
      const { id_producto } = ctx.params;
      const body = await ctx.request.body.json();
      const { motivo } = body;

      if (!id_producto) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del producto requerido" 
        };
        return;
      }

      const productosModel = new ProductosModel();
      const result = await productosModel.EliminarProducto(parseInt(id_producto));

      if (result.success) {
        // Registrar la acción en los logs del sistema
        const { conexion } = await import("../Models/Conexion.ts");
        await conexion.execute(`
          INSERT INTO configuracion_sistema (clave, valor, descripcion) 
          VALUES (?, ?, ?)
        `, [
          `producto_eliminado_${id_producto}`,
          motivo || 'Producto eliminado por administrador',
          `Producto eliminado el ${new Date().toISOString()}`
        ]);

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Producto eliminado correctamente",
          motivo: motivo || 'Producto eliminado por administrador'
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarProductoInapropiado:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Obtener todos los reportes
  static async ObtenerTodosLosReportes(ctx: Context) {
    try {
      const reportesModel = new ReportesModel();
      const reportesRaw = await reportesModel.ObtenerTodosLosReportes();

      // ✅ Transformar al formato esperado por el frontend (basado en estructura real de BD)
      const reportes = reportesRaw.map((reporte: ReporteData) => ({
        id_reporte: reporte.id_reporte,
        id_usuario_reportante: reporte.id_usuario_reportante,
        tipo_reporte: reporte.tipo_reporte,
        id_elemento_reportado: reporte.id_elemento_reportado || 0,
        tipo_elemento: reporte.tipo_elemento,
        descripcion: reporte.descripcion || '',
        estado: reporte.estado || 'pendiente',
        fecha_reporte: reporte.fecha_reporte ? (reporte.fecha_reporte instanceof Date ? reporte.fecha_reporte.toISOString() : new Date(reporte.fecha_reporte as string).toISOString()) : new Date().toISOString(),
        fecha_resolucion: reporte.fecha_resolucion ? (reporte.fecha_resolucion instanceof Date ? reporte.fecha_resolucion.toISOString() : new Date(reporte.fecha_resolucion as string).toISOString()) : undefined,
        accion_tomada: reporte.accion_tomada || undefined,
        // Campos adicionales para el frontend
        nombre_reportador: reporte.nombre_reportador || 'Usuario desconocido',
        email_reportador: reporte.email_reportador || '',
        elemento_reportado: reporte.nombre_producto_reportado || reporte.nombre_usuario_reportado || 'N/A',
        tipo_elemento_display: reporte.tipo_elemento === 'producto' ? 'Producto' : 'Usuario'
      }));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: reportes, // ✅ Formato estándar con data
        reportes, // ✅ Mantener también para compatibilidad
        total: reportes.length,
        message: `${reportes.length} reportes encontrados`
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosReportes:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Resolver reporte
  static async ResolverReporte(ctx: RouterContext<"/admin/reporte/:id_reporte">) {
    try {
      const { id_reporte } = ctx.params;
      const body = await ctx.request.body.json();
      const { estado, accion_tomada } = body;

      if (!id_reporte || !estado) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_FIELDS",
          message: "ID del reporte y estado son requeridos" 
        };
        return;
      }

      const estadosValidos = ['pendiente', 'en_revision', 'resuelto', 'rechazado'];
      if (!estadosValidos.includes(estado)) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "INVALID_STATE",
          message: "Estado inválido. Estados válidos: pendiente, en_revision, resuelto, rechazado" 
        };
        return;
      }

      const reportesModel = new ReportesModel();
      const result = await reportesModel.ActualizarEstadoReporte(parseInt(id_reporte), estado, accion_tomada);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ResolverReporte:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Eliminar reporte resuelto
  static async EliminarReporteResuelto(ctx: RouterContext<"/admin/reporte/:id_reporte">) {
    try {
      const { id_reporte } = ctx.params;

      if (!id_reporte) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del reporte requerido" 
        };
        return;
      }

      const reportesModel = new ReportesModel();
      const result = await reportesModel.EliminarReporteResuelto(parseInt(id_reporte));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en EliminarReporteResuelto:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Obtener estadísticas generales
  static async ObtenerEstadisticasGenerales(ctx: Context) {
    try {
      const estadisticasModel = new EstadisticasModel();
      const statsRaw = await estadisticasModel.ObtenerEstadisticasGenerales();

      // Contar admins
      const adminCount = await conexion.query("SELECT COUNT(*) as total FROM usuarios WHERE rol = 'admin'");
      
      // Calcular pedidos por estado
      const pedidosPendientes = await conexion.query(
        "SELECT COUNT(*) as total FROM pedidos WHERE estado = 'pendiente'"
      );
      const pedidosCompletados = await conexion.query(
        "SELECT COUNT(*) as total FROM pedidos WHERE estado = 'entregado'"
      );
      const pedidosCancelados = await conexion.query(
        "SELECT COUNT(*) as total FROM pedidos WHERE estado = 'cancelado'"
      );
      
      // Calcular ingresos totales desde pedidos entregados (basado en estructura real de BD)
      const ingresosTotales = await conexion.query(
        "SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE estado = 'entregado' AND estado_pago = 'pagado'"
      );
      
      // ✅ Transformar al formato esperado por el frontend
      const estadisticas = {
        total_usuarios: statsRaw.total_usuarios || 0,
        total_productos: statsRaw.total_productos || 0,
        total_pedidos: statsRaw.total_pedidos || 0,
        ingresos_totales: ingresosTotales[0]?.total || 0,
        usuarios_nuevos: statsRaw.actividad_reciente?.usuarios_nuevos_ultimo_mes || 0,
        productos_nuevos: statsRaw.actividad_reciente?.productos_nuevos_ultimo_mes || 0,
        pedidos_completados: pedidosCompletados[0]?.total || 0,
        pedidos_pendientes: pedidosPendientes[0]?.total || 0,
        pedidos_cancelados: pedidosCancelados[0]?.total || 0,
        ingresos_periodo: 0, // TODO: Calcular
        usuarios_por_rol: {
          admin: adminCount[0]?.total || 0,
          productor: statsRaw.total_productores || 0,
          consumidor: statsRaw.total_consumidores || 0
        },
        productos_por_categoria: statsRaw.productos_por_categoria?.map((c: { categoria: string; cantidad: number }) => ({
          nombre: c.categoria,
          cantidad: c.cantidad,
          total: c.cantidad
        })) || [],
        tasa_conversion: 0, // TODO: Calcular
        ticket_promedio: 0, // TODO: Calcular
        productos_por_usuario: statsRaw.total_usuarios > 0 ? statsRaw.total_productos / statsRaw.total_usuarios : 0,
        pedidos_por_usuario: statsRaw.total_usuarios > 0 ? statsRaw.total_pedidos / statsRaw.total_usuarios : 0
      };

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: estadisticas, // ✅ Formato estándar con data
        estadisticas, // ✅ Mantener también para compatibilidad
        message: "Estadísticas obtenidas exitosamente"
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasGenerales:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Obtener actividad reciente
  static async ObtenerActividadReciente(ctx: Context) {
    try {
      const estadisticasModel = new EstadisticasModel();
      const actividadRaw = await estadisticasModel.ObtenerActividadReciente();

      // ✅ Transformar al formato esperado por el frontend (array de actividades)
      const actividad: Array<{
        id: number;
        tipo: string;
        descripcion: string;
        timestamp: string;
        usuario?: string;
      }> = [];

      let idCounter = 1;
      
      // Usuarios nuevos
      actividadRaw.usuarios_nuevos?.forEach((item: { cantidad: number; fecha: string }) => {
        actividad.push({
          id: idCounter++,
          tipo: 'usuario_registrado',
          descripcion: `${item.cantidad} usuario(s) registrado(s)`,
          timestamp: item.fecha,
          usuario: 'Sistema'
        });
      });

      // Productos nuevos
      actividadRaw.productos_nuevos?.forEach((item: { cantidad: number; fecha: string }) => {
        actividad.push({
          id: idCounter++,
          tipo: 'producto_creado',
          descripcion: `${item.cantidad} producto(s) creado(s)`,
          timestamp: item.fecha,
          usuario: 'Sistema'
        });
      });

      // Pedidos nuevos
      actividadRaw.pedidos_nuevos?.forEach((item: { cantidad: number; fecha: string }) => {
        actividad.push({
          id: idCounter++,
          tipo: 'pedido_realizado',
          descripcion: `${item.cantidad} pedido(s) realizado(s)`,
          timestamp: item.fecha,
          usuario: 'Sistema'
        });
      });

      // Ordenar por fecha más reciente
      actividad.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: actividad, // ✅ Formato estándar con data (array)
        actividad, // ✅ Mantener también para compatibilidad
        message: `${actividad.length} actividades encontradas`
      };
    } catch (error) {
      console.error("Error en ObtenerActividadReciente:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Acceder a panel de productor (simular)
  static async AccederPanelProductor(ctx: RouterContext<"/admin/usuario/:id_usuario/productor">) {
    try {
      const { id_usuario } = ctx.params;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del usuario requerido" 
        };
        return;
      }

      // Verificar que el usuario sea productor
      const { conexion } = await import("../Models/Conexion.ts");
      const usuario = await conexion.query("SELECT rol FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (usuario.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { 
          success: false,
          error: "USER_NOT_FOUND",
          message: "Usuario no encontrado" 
        };
        return;
      }

      if (usuario[0].rol !== 'productor') {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "INVALID_ROLE",
          message: "El usuario no es un productor" 
        };
        return;
      }

      // Obtener datos del panel de productor
      const productos = await conexion.query("SELECT * FROM productos WHERE id_usuario = ?", [id_usuario]);
      const mensajes = await conexion.query("SELECT COUNT(*) as total FROM mensajes WHERE id_destinatario = ?", [id_usuario]);
      const pedidos = await conexion.query("SELECT COUNT(*) as total FROM pedidos WHERE id_productor = ?", [id_usuario]);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Acceso al panel de productor autorizado",
        datos: {
          usuario_id: id_usuario,
          total_productos: productos.length,
          total_mensajes: mensajes[0]?.total || 0,
          total_pedidos: pedidos[0]?.total || 0
        }
      };
    } catch (error) {
      console.error("Error en AccederPanelProductor:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // 📌 Acceder a panel de consumidor (simular)
  static async AccederPanelConsumidor(ctx: RouterContext<"/admin/usuario/:id_usuario/consumidor">) {
    try {
      const { id_usuario } = ctx.params;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del usuario requerido" 
        };
        return;
      }

      // Verificar que el usuario sea consumidor
      const { conexion } = await import("../Models/Conexion.ts");
      const usuario = await conexion.query("SELECT rol FROM usuarios WHERE id_usuario = ?", [id_usuario]);

      if (usuario.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { 
          success: false,
          error: "USER_NOT_FOUND",
          message: "Usuario no encontrado" 
        };
        return;
      }

      if (usuario[0].rol !== 'consumidor') {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "INVALID_ROLE",
          message: "El usuario no es un consumidor" 
        };
        return;
      }

      // Obtener datos del panel de consumidor
      const mensajes = await conexion.query("SELECT COUNT(*) as total FROM mensajes WHERE id_remitente = ?", [id_usuario]);
      const pedidos = await conexion.query("SELECT COUNT(*) as total FROM pedidos WHERE id_consumidor = ?", [id_usuario]);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Acceso al panel de consumidor autorizado",
        datos: {
          usuario_id: id_usuario,
          total_mensajes_enviados: mensajes[0]?.total || 0,
          total_pedidos: pedidos[0]?.total || 0
        }
      };
    } catch (error) {
      console.error("Error en AccederPanelConsumidor:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
      };
    }
  }

  // ========== PEDIDOS ==========
  static async ObtenerTodosLosPedidos(ctx: Context) {
    try {
      const estado = ctx.request.url.searchParams.get('estado');
      const pedidosModel = new PedidosModel();
      let pedidos = await pedidosModel.ListarPedidos();
      
      if (estado) {
        pedidos = pedidos.filter((p: any) => p.estado === estado);
      }

      // Enriquecer con información de usuarios y detalles
      const pedidosEnriquecidos = await Promise.all(pedidos.map(async (pedido: any) => {
        try {
          const consumidorResult = await conexion.query("SELECT nombre, email FROM usuarios WHERE id_usuario = ?", [pedido.id_consumidor]);
          const productorResult = await conexion.query("SELECT nombre, email FROM usuarios WHERE id_usuario = ?", [pedido.id_productor]);
          const detallesResult = await conexion.query("SELECT * FROM detalle_pedidos WHERE id_pedido = ?", [pedido.id_pedido]);
          
          return {
            ...pedido,
            consumidor: consumidorResult && consumidorResult.length > 0 ? consumidorResult[0] : null,
            productor: productorResult && productorResult.length > 0 ? productorResult[0] : null,
            detalles: detallesResult || []
          };
        } catch (err) {
          console.error(`Error enriqueciendo pedido ${pedido.id_pedido}:`, err);
          return {
            ...pedido,
            consumidor: null,
            productor: null,
            detalles: []
          };
        }
      }));

      ctx.response.status = 200;
      ctx.response.body = { success: true, data: pedidosEnriquecidos, total: pedidosEnriquecidos.length };
    } catch (error) {
      console.error("Error en ObtenerTodosLosPedidos:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async CambiarEstadoPedido(ctx: RouterContext<"/admin/pedido/:id_pedido/estado">) {
    try {
      const { id_pedido } = ctx.params;
      
      if (!id_pedido) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_ID", message: "ID del pedido requerido" };
        return;
      }

      const body = await ctx.request.body.json();
      const { estado } = body;

      if (!estado || !['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'].includes(estado)) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "INVALID_STATE", message: "Estado inválido" };
        return;
      }

      const result = await conexion.execute("UPDATE pedidos SET estado = ? WHERE id_pedido = ?", [estado, parseInt(id_pedido)]);
      
      if (result && result.affectedRows && result.affectedRows > 0) {
        ctx.response.status = 200;
        ctx.response.body = { success: true, message: "Estado del pedido actualizado" };
      } else {
        ctx.response.status = 404;
        ctx.response.body = { success: false, error: "NOT_FOUND", message: "Pedido no encontrado" };
      }
    } catch (error) {
      console.error("Error en CambiarEstadoPedido:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== CATEGORÍAS ==========
  static async ObtenerTodasLasCategorias(ctx: Context) {
    try {
      const categoriasModel = new CategoriasModel();
      const categorias = await categoriasModel.ListarTodasLasCategorias();
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: categorias || [], total: categorias?.length || 0 };
    } catch (error) {
      console.error("Error en ObtenerTodasLasCategorias:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async CrearCategoria(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      if (!body.nombre) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_FIELDS", message: "El nombre es requerido" };
        return;
      }
      const categoriasModel = new CategoriasModel(body);
      const result = await categoriasModel.CrearCategoria();
      ctx.response.status = result.success ? 201 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en CrearCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async ActualizarCategoria(ctx: RouterContext<"/admin/categoria/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;
      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_ID", message: "ID de categoría requerido" };
        return;
      }
      const body = await ctx.request.body.json();
      const categoriasModel = new CategoriasModel(body);
      const result = await categoriasModel.ActualizarCategoria(parseInt(id_categoria));
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en ActualizarCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async EliminarCategoria(ctx: RouterContext<"/admin/categoria/:id_categoria">) {
    try {
      const { id_categoria } = ctx.params;
      if (!id_categoria) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_ID", message: "ID de categoría requerido" };
        return;
      }
      const categoriasModel = new CategoriasModel();
      const result = await categoriasModel.EliminarCategoria(parseInt(id_categoria));
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en EliminarCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== MENSAJES ==========
  static async ObtenerTodosLosMensajes(ctx: Context) {
    try {
      const todosMensajes = await conexion.query(`
        SELECT m.*, 
               u_remitente.nombre as nombre_remitente,
               u_destinatario.nombre as nombre_destinatario,
               p.nombre as nombre_producto
        FROM mensajes m
        LEFT JOIN usuarios u_remitente ON m.id_remitente = u_remitente.id_usuario
        LEFT JOIN usuarios u_destinatario ON m.id_destinatario = u_destinatario.id_usuario
        LEFT JOIN productos p ON m.id_producto = p.id_producto
        ORDER BY m.fecha_envio DESC
      `);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: todosMensajes || [], total: todosMensajes?.length || 0 };
    } catch (error) {
      console.error("Error en ObtenerTodosLosMensajes:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async EliminarMensaje(ctx: RouterContext<"/admin/mensaje/:id_mensaje">) {
    try {
      const { id_mensaje } = ctx.params;
      if (!id_mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_ID", message: "ID de mensaje requerido" };
        return;
      }
      const mensajesModel = new MensajesModel();
      const result = await mensajesModel.EliminarMensaje(parseInt(id_mensaje));
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en EliminarMensaje:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== RESEÑAS ==========
  static async ObtenerTodasLasResenas(ctx: Context) {
    try {
      const resenaModel = new Resena();
      const resenas = await resenaModel.ListarResenas();
      const resenasEnriquecidas = await Promise.all(resenas.map(async (resena: any) => {
        try {
          const consumidorResult = await conexion.query("SELECT nombre FROM usuarios WHERE id_usuario = ?", [resena.id_consumidor]);
          const productorResult = await conexion.query("SELECT nombre FROM usuarios WHERE id_usuario = ?", [resena.id_productor]);
          const productoResult = await conexion.query("SELECT nombre FROM productos WHERE id_producto = ?", [resena.id_producto]);
          return {
            ...resena,
            nombre_consumidor: consumidorResult && consumidorResult.length > 0 ? consumidorResult[0].nombre : null,
            nombre_productor: productorResult && productorResult.length > 0 ? productorResult[0].nombre : null,
            nombre_producto: productoResult && productoResult.length > 0 ? productoResult[0].nombre : null
          };
        } catch (err) {
          console.error(`Error enriqueciendo reseña ${resena.id_resena}:`, err);
          return {
            ...resena,
            nombre_consumidor: null,
            nombre_productor: null,
            nombre_producto: null
          };
        }
      }));
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: resenasEnriquecidas, total: resenasEnriquecidas.length };
    } catch (error) {
      console.error("Error en ObtenerTodasLasResenas:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async EliminarResena(ctx: RouterContext<"/admin/resena/:id_resena">) {
    try {
      const { id_resena } = ctx.params;
      if (!id_resena) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_ID", message: "ID de reseña requerido" };
        return;
      }
      const resenaModel = new Resena();
      const result = await resenaModel.EliminarResena(parseInt(id_resena));
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en EliminarResena:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== NOTIFICACIONES ==========
  static async ObtenerTodasLasNotificaciones(ctx: Context) {
    try {
      const tipo = ctx.request.url.searchParams.get('tipo');
      let query = `SELECT n.*, u.nombre as nombre_usuario FROM notificaciones n LEFT JOIN usuarios u ON n.id_usuario = u.id_usuario`;
      const params: any[] = [];
      if (tipo) {
        query += ` WHERE n.tipo = ?`;
        params.push(tipo);
      }
      query += ` ORDER BY n.fecha_creacion DESC`;
      const notificaciones = await conexion.query(query, params);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: notificaciones, total: notificaciones.length };
    } catch (error) {
      console.error("Error en ObtenerTodasLasNotificaciones:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, error: "INTERNAL_ERROR", message: "Error interno del servidor" };
    }
  }

  static async CrearNotificacion(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      if (!body.id_usuario || !body.titulo || !body.mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_FIELDS", message: "Faltan campos requeridos: id_usuario, titulo, mensaje" };
        return;
      }
      const notificacionesModel = new NotificacionesModel(body);
      const result = await notificacionesModel.CrearNotificacion();
      ctx.response.status = result.success ? 201 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en CrearNotificacion:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async CrearNotificacionMasiva(ctx: Context) {
    console.log("✅ CrearNotificacionMasiva llamado");
    try {
      const body = await ctx.request.body.json();
      console.log("📥 Body recibido:", body);
      const { titulo, mensaje, tipo } = body;

      if (!titulo || !mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false, 
          error: "MISSING_FIELDS", 
          message: "Faltan campos requeridos: titulo, mensaje" 
        };
        return;
      }

      // Obtener todos los usuarios activos
      const usuarios = await conexion.query(
        "SELECT id_usuario FROM usuarios WHERE activo = 1"
      );

      if (!usuarios || usuarios.length === 0) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false, 
          error: "NO_USERS", 
          message: "No hay usuarios activos en el sistema" 
        };
        return;
      }

      await conexion.execute('START TRANSACTION');

      let creadas = 0;
      let errores = 0;

      for (const usuario of usuarios) {
        try {
          const notificacionData = {
            id_usuario: usuario.id_usuario,
            titulo,
            mensaje,
            tipo: tipo || 'sistema'
          };
          const notificacionesModel = new NotificacionesModel(notificacionData);
          const result = await notificacionesModel.CrearNotificacion();
          if (result.success) {
            creadas++;
          } else {
            errores++;
          }
        } catch (error) {
          console.error(`Error creando notificación para usuario ${usuario.id_usuario}:`, error);
          errores++;
        }
      }

      await conexion.execute('COMMIT');

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: `Notificaciones creadas: ${creadas} exitosas, ${errores} errores`,
        data: {
          creadas,
          errores,
          total_usuarios: usuarios.length
        }
      };
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error("Error en CrearNotificacionMasiva:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async ActualizarNotificacion(ctx: RouterContext<"/admin/notificacion/:id_notificacion">) {
    try {
      const { id_notificacion } = ctx.params;
      const body = await ctx.request.body.json();
      const { titulo, mensaje, tipo } = body;

      if (!id_notificacion) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false, 
          error: "MISSING_ID", 
          message: "ID de notificación requerido" 
        };
        return;
      }

      if (!titulo || !mensaje) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false, 
          error: "MISSING_FIELDS", 
          message: "Faltan campos requeridos: titulo, mensaje" 
        };
        return;
      }

      await conexion.execute('START TRANSACTION');

      const result = await conexion.execute(
        'UPDATE notificaciones SET titulo = ?, mensaje = ?, tipo = ? WHERE id_notificacion = ?',
        [titulo, mensaje, tipo || 'sistema', parseInt(id_notificacion)]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute('COMMIT');
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: 'Notificación actualizada exitosamente.'
        };
      } else {
        await conexion.execute('ROLLBACK');
        ctx.response.status = 404;
        ctx.response.body = { 
          success: false, 
          error: "NOT_FOUND", 
          message: "Notificación no encontrada" 
        };
      }
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error("Error en ActualizarNotificacion:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async EliminarNotificacion(ctx: RouterContext<"/admin/notificacion/:id_notificacion">) {
    try {
      const { id_notificacion } = ctx.params;
      
      if (!id_notificacion) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: "MISSING_ID", message: "ID de notificación requerido" };
        return;
      }

      const notificacionResult = await conexion.query("SELECT id_usuario FROM notificaciones WHERE id_notificacion = ?", [parseInt(id_notificacion)]);
      if (!notificacionResult || notificacionResult.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { success: false, error: "NOT_FOUND", message: "Notificación no encontrada" };
        return;
      }
      
      const notificacionesModel = new NotificacionesModel();
      const result = await notificacionesModel.EliminarNotificacion(parseInt(id_notificacion), notificacionResult[0].id_usuario);
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Error en EliminarNotificacion:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== UBICACIONES ==========
  static async ObtenerRegiones(ctx: Context) {
    try {
      const regiones = await conexion.query("SELECT * FROM regiones ORDER BY nombre");
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: regiones || [] };
    } catch (error) {
      console.error("Error en ObtenerRegiones:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async ObtenerDepartamentos(ctx: Context) {
    try {
      const id_region = ctx.request.url.searchParams.get('id_region');
      let query = "SELECT d.*, r.nombre as nombre_region FROM departamentos d LEFT JOIN regiones r ON d.id_region = r.id_region";
      const params: any[] = [];
      if (id_region) {
        query += " WHERE d.id_region = ?";
        params.push(parseInt(id_region));
      }
      query += " ORDER BY d.nombre";
      const departamentos = await conexion.query(query, params);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: departamentos || [] };
    } catch (error) {
      console.error("Error en ObtenerDepartamentos:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async ObtenerCiudades(ctx: Context) {
    try {
      const id_departamento = ctx.request.url.searchParams.get('id_departamento');
      let query = "SELECT c.*, d.nombre as nombre_departamento FROM ciudades c LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento";
      const params: any[] = [];
      if (id_departamento) {
        query += " WHERE c.id_departamento = ?";
        params.push(parseInt(id_departamento));
      }
      query += " ORDER BY c.nombre";
      const ciudades = await conexion.query(query, params);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: ciudades || [] };
    } catch (error) {
      console.error("Error en ObtenerCiudades:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== HISTORIAL DE PRECIOS ==========
  static async ObtenerHistorialPrecios(ctx: Context) {
    try {
      const id_producto = ctx.request.url.searchParams.get('id_producto');
      let query = `SELECT hp.*, p.nombre as nombre_producto, u.nombre as nombre_usuario 
                   FROM historial_precios hp 
                   LEFT JOIN productos p ON hp.id_producto = p.id_producto 
                   LEFT JOIN usuarios u ON hp.id_usuario_modifico = u.id_usuario`;
      const params: any[] = [];
      if (id_producto) {
        query += " WHERE hp.id_producto = ?";
        params.push(parseInt(id_producto));
      }
      query += " ORDER BY hp.fecha_cambio DESC";
      const historial = await conexion.query(query, params);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: historial || [], total: historial?.length || 0 };
    } catch (error) {
      console.error("Error en ObtenerHistorialPrecios:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // ========== CARRITOS Y LISTAS ==========
  static async ObtenerCarritos(ctx: Context) {
    try {
      const carritos = await conexion.query(`
        SELECT c.*, u.nombre as nombre_usuario, p.nombre as nombre_producto, p.precio
        FROM carrito c
        LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
        LEFT JOIN productos p ON c.id_producto = p.id_producto
        ORDER BY c.fecha_agregado DESC
      `);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: carritos || [], total: carritos?.length || 0 };
    } catch (error) {
      console.error("Error en ObtenerCarritos:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  static async ObtenerListasDeseos(ctx: Context) {
    try {
      const listas = await conexion.query(`
        SELECT ld.*, u.nombre as nombre_usuario, p.nombre as nombre_producto, p.precio
        FROM lista_deseos ld
        LEFT JOIN usuarios u ON ld.id_usuario = u.id_usuario
        LEFT JOIN productos p ON ld.id_producto = p.id_producto
        ORDER BY ld.fecha_agregado DESC
      `);
      ctx.response.status = 200;
      ctx.response.body = { success: true, data: listas || [], total: listas?.length || 0 };
    } catch (error) {
      console.error("Error en ObtenerListasDeseos:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // 📌 Obtener configuración del sistema
  static async ObtenerConfiguracion(ctx: Context) {
    try {
      // Verificar si existe la tabla configuracion_sistema
      const tableExists = await conexion.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'configuracion_sistema'
      `);

      if (tableExists[0]?.count === 0) {
        // Si no existe la tabla, crear configuración por defecto
        const defaultConfig = {
          nombre_sistema: 'AgroStock',
          email_contacto: 'contacto@agrostock.com',
          telefono_contacto: '+57 300 000 0000',
          direccion: 'Colombia',
          mantenimiento: false,
          limite_productos: 100,
          dias_expiracion_reportes: 30
        };

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          data: defaultConfig,
          message: 'Configuración obtenida correctamente'
        };
        return;
      }

      // Obtener configuración de la base de datos
      const configRows = await conexion.query(`
        SELECT clave, valor 
        FROM configuracion_sistema
        WHERE clave IN ('nombre_sistema', 'email_contacto', 'telefono_contacto', 'direccion', 'mantenimiento', 'limite_productos', 'dias_expiracion_reportes')
      `);

      const config: any = {
        nombre_sistema: 'AgroStock',
        email_contacto: 'contacto@agrostock.com',
        telefono_contacto: '+57 300 000 0000',
        direccion: 'Colombia',
        mantenimiento: false,
        limite_productos: 100,
        dias_expiracion_reportes: 30
      };

      // Mapear valores de la base de datos
      configRows.forEach((row: any) => {
        const clave = row.clave;
        let valor = row.valor;

        // Convertir valores booleanos y numéricos
        if (clave === 'mantenimiento') {
          valor = valor === 'true' || valor === '1' || valor === 1;
        } else if (clave === 'limite_productos' || clave === 'dias_expiracion_reportes') {
          valor = parseInt(valor) || 0;
        }

        config[clave] = valor;
      });

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: config,
        message: 'Configuración obtenida correctamente'
      };
    } catch (error) {
      console.error("Error en ObtenerConfiguracion:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }

  // 📌 Actualizar configuración del sistema
  static async ActualizarConfiguracion(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const {
        nombre_sistema,
        email_contacto,
        telefono_contacto,
        direccion,
        mantenimiento,
        limite_productos,
        dias_expiracion_reportes
      } = body;

      // Verificar si existe la tabla configuracion_sistema
      const tableExists = await conexion.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'configuracion_sistema'
      `);

      if (tableExists[0]?.count === 0) {
        // Crear la tabla si no existe
        await conexion.execute(`
          CREATE TABLE IF NOT EXISTS configuracion_sistema (
            id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
            clave VARCHAR(100) UNIQUE NOT NULL,
            valor TEXT,
            descripcion TEXT,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
      }

      // Actualizar o insertar cada configuración
      const configuraciones = [
        { clave: 'nombre_sistema', valor: nombre_sistema || 'AgroStock' },
        { clave: 'email_contacto', valor: email_contacto || 'contacto@agrostock.com' },
        { clave: 'telefono_contacto', valor: telefono_contacto || '+57 300 000 0000' },
        { clave: 'direccion', valor: direccion || 'Colombia' },
        { clave: 'mantenimiento', valor: mantenimiento ? 'true' : 'false' },
        { clave: 'limite_productos', valor: String(limite_productos || 100) },
        { clave: 'dias_expiracion_reportes', valor: String(dias_expiracion_reportes || 30) }
      ];

      await conexion.execute('START TRANSACTION');

      for (const config of configuraciones) {
        await conexion.execute(`
          INSERT INTO configuracion_sistema (clave, valor, descripcion)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE valor = ?, descripcion = ?
        `, [
          config.clave,
          config.valor,
          `Configuración de ${config.clave}`,
          config.valor,
          `Configuración de ${config.clave}`
        ]);
      }

      await conexion.execute('COMMIT');

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: 'Configuración actualizada correctamente',
        data: {
          nombre_sistema: nombre_sistema || 'AgroStock',
          email_contacto: email_contacto || 'contacto@agrostock.com',
          telefono_contacto: telefono_contacto || '+57 300 000 0000',
          direccion: direccion || 'Colombia',
          mantenimiento: mantenimiento || false,
          limite_productos: limite_productos || 100,
          dias_expiracion_reportes: dias_expiracion_reportes || 30
        }
      };
    } catch (error) {
      await conexion.execute('ROLLBACK');
      console.error("Error en ActualizarConfiguracion:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false, 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Error interno del servidor" 
      };
    }
  }
}
