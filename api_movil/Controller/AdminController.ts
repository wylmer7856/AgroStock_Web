import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { Usuario } from "../Models/UsuariosModel.ts";
import { ProductosModel } from "../Models/ProductosModel.ts";
import { ReportesModel, ReporteData } from "../Models/ReportesModel.ts";
import { EstadisticasModel } from "../Models/EstadisticasModel.ts";
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
      const { nombre, email, password, telefono, direccion, id_ciudad, rol } = body;

      if (!id_usuario) {
        ctx.response.status = 400;
        ctx.response.body = { 
          success: false,
          error: "MISSING_ID",
          message: "ID del usuario requerido" 
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

      // ✅ Hashear password si se proporciona
      let hashedPassword = password;
      if (password && password.trim() !== '') {
        const { securityService } = await import("../Services/SecurityService.ts");
        hashedPassword = await securityService.hashPassword(password);
      }

      const usuarioData = {
        id_usuario: parseInt(id_usuario),
        nombre,
        email,
        password: hashedPassword || undefined, // Solo incluir si se proporciona
        telefono,
        direccion,
        id_ciudad: id_ciudad ? parseInt(id_ciudad) : 1, // Usar ciudad por defecto si no se especifica
        rol,
        activo: true,
        email_verificado: false
      };

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
        message: "Error interno del servidor" 
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
    } catch (error) {
      console.error("Error en EliminarUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { 
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor" 
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
}
