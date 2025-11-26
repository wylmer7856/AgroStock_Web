import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { EstadisticasModel } from "../Models/EstadisticasModel.ts";

export class EstadisticasController {
  
  // 📌 Obtener estadísticas generales del sistema (solo admin)
  static async ObtenerEstadisticasGenerales(ctx: Context) {
    try {
      const estadisticasModel = new EstadisticasModel();
      const estadisticas = await estadisticasModel.ObtenerEstadisticasGenerales();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasGenerales:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de un usuario específico
  static async ObtenerEstadisticasUsuario(ctx: RouterContext<"/estadisticas/usuario/:id_usuario">) {
    try {
      const { id_usuario } = ctx.params;
      const userId = ctx.state.user.id;
      const userRole = ctx.state.user.rol;

      // Solo el propio usuario o un admin pueden ver las estadísticas
      if (userRole !== 'admin' && parseInt(id_usuario) !== userId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No tienes permisos para ver estas estadísticas" };
        return;
      }

      const estadisticasModel = new EstadisticasModel();
      const estadisticas = await estadisticasModel.ObtenerEstadisticasUsuario(parseInt(id_usuario));

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Actualizar estadísticas de un usuario
  static async ActualizarEstadisticasUsuario(ctx: RouterContext<"/estadisticas/usuario/:id_usuario">) {
    try {
      const { id_usuario } = ctx.params;
      const userId = ctx.state.user.id;
      const userRole = ctx.state.user.rol;

      // Solo el propio usuario o un admin pueden actualizar las estadísticas
      if (userRole !== 'admin' && parseInt(id_usuario) !== userId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No tienes permisos para actualizar estas estadísticas" };
        return;
      }

      const estadisticasModel = new EstadisticasModel();
      const result = await estadisticasModel.ActualizarEstadisticasUsuario(parseInt(id_usuario));

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ActualizarEstadisticasUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener actividad reciente del sistema (solo admin)
  static async ObtenerActividadReciente(ctx: Context) {
    try {
      const estadisticasModel = new EstadisticasModel();
      const actividad = await estadisticasModel.ObtenerActividadReciente();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        actividad
      };
    } catch (error) {
      console.error("Error en ObtenerActividadReciente:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de productos por categoría
  static async ObtenerEstadisticasProductosPorCategoria(ctx: Context) {
    try {
      const { conexion } = await import("../Models/Conexion.ts");
      
      const estadisticas = await conexion.query(`
        SELECT 
          c.nombre as categoria,
          COUNT(p.id_producto) as total_productos,
          AVG(p.precio) as precio_promedio,
          SUM(p.stock) as stock_total,
          COUNT(DISTINCT p.id_usuario) as productores_unicos
        FROM categorias c
        LEFT JOIN productos p ON c.id_categoria = p.id_categoria
        WHERE c.activa = 1
        GROUP BY c.id_categoria, c.nombre
        ORDER BY total_productos DESC
      `);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasProductosPorCategoria:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de usuarios por región
  static async ObtenerEstadisticasUsuariosPorRegion(ctx: Context) {
    try {
      const { conexion } = await import("../Models/Conexion.ts");
      
      const estadisticas = await conexion.query(`
        SELECT 
          r.nombre as region,
          COUNT(u.id_usuario) as total_usuarios,
          COUNT(CASE WHEN u.rol = 'productor' THEN 1 END) as productores,
          COUNT(CASE WHEN u.rol = 'consumidor' THEN 1 END) as consumidores,
          COUNT(CASE WHEN u.rol = 'admin' THEN 1 END) as administradores
        FROM regiones r
        LEFT JOIN departamentos d ON r.id_region = d.id_region
        LEFT JOIN ciudades c ON d.id_departamento = c.id_departamento
        LEFT JOIN usuarios u ON c.id_ciudad = u.id_ciudad
        GROUP BY r.id_region, r.nombre
        ORDER BY total_usuarios DESC
      `);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasUsuariosPorRegion:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de pedidos
  static async ObtenerEstadisticasPedidos(ctx: Context) {
    try {
      const { conexion } = await import("../Models/Conexion.ts");
      
      const estadisticas = await conexion.query(`
        SELECT 
          estado,
          COUNT(*) as total,
          AVG(total) as promedio_valor,
          SUM(total) as valor_total
        FROM pedidos
        GROUP BY estado
        ORDER BY total DESC
      `);

      const pedidosPorMes = await conexion.query(`
        SELECT 
          DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
          COUNT(*) as total_pedidos,
          SUM(total) as valor_total,
          AVG(total) as promedio_valor
        FROM pedidos
        WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
        ORDER BY mes DESC
      `);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas: {
          por_estado: estadisticas,
          por_mes: pedidosPorMes
        }
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasPedidos:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de mensajes
  static async ObtenerEstadisticasMensajes(ctx: Context) {
    try {
      const { conexion } = await import("../Models/Conexion.ts");
      
      const estadisticas = await conexion.query(`
        SELECT 
          tipo_mensaje,
          COUNT(*) as total,
          COUNT(CASE WHEN leido = 1 THEN 1 END) as leidos,
          COUNT(CASE WHEN leido = 0 THEN 1 END) as no_leidos
        FROM mensajes
        GROUP BY tipo_mensaje
        ORDER BY total DESC
      `);

      const mensajesPorMes = await conexion.query(`
        SELECT 
          DATE_FORMAT(fecha_envio, '%Y-%m') as mes,
          COUNT(*) as total_mensajes,
          COUNT(CASE WHEN leido = 1 THEN 1 END) as leidos,
          COUNT(CASE WHEN leido = 0 THEN 1 END) as no_leidos
        FROM mensajes
        WHERE fecha_envio >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_envio, '%Y-%m')
        ORDER BY mes DESC
      `);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas: {
          por_tipo: estadisticas,
          por_mes: mensajesPorMes
        }
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasMensajes:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de ventas del usuario actual (para productores)
  static async ObtenerMisVentas(ctx: Context) {
    try {
      const user = ctx.state.user;
      
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: "NO_AUTENTICADO",
          message: "No autenticado."
        };
        return;
      }

      // Solo productores y admin pueden ver sus ventas
      if (user.rol !== 'productor' && user.rol !== 'admin') {
        ctx.response.status = 403;
        ctx.response.body = {
          success: false,
          error: "SIN_PERMISOS",
          message: "Solo los productores pueden ver sus estadísticas de ventas."
        };
        return;
      }

      const { conexion } = await import("../Models/Conexion.ts");
      const userId = user.id;

      // Estadísticas generales de ventas
      const totalPedidos = await conexion.query(`
        SELECT COUNT(*) as total FROM pedidos WHERE id_productor = ?
      `, [userId]);

      const totalVentas = await conexion.query(`
        SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE id_productor = ?
      `, [userId]);

      const pedidosPorEstado = await conexion.query(`
        SELECT 
          estado,
          COUNT(*) as cantidad,
          COALESCE(SUM(total), 0) as total
        FROM pedidos
        WHERE id_productor = ?
        GROUP BY estado
        ORDER BY cantidad DESC
      `, [userId]);

      // Ventas por mes (últimos 12 meses)
      const ventasPorMes = await conexion.query(`
        SELECT 
          DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
          COUNT(*) as total_pedidos,
          COALESCE(SUM(total), 0) as total_ventas,
          COALESCE(AVG(total), 0) as promedio_venta
        FROM pedidos
        WHERE id_productor = ? 
          AND fecha_pedido >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
        ORDER BY mes DESC
      `, [userId]);

      // Productos más vendidos
      const productosMasVendidos = await conexion.query(`
        SELECT 
          p.id_producto,
          p.nombre,
          p.precio,
          SUM(dp.cantidad) as cantidad_vendida,
          SUM(dp.subtotal) as total_ventas
        FROM detalle_pedidos dp
        INNER JOIN pedidos pe ON dp.id_pedido = pe.id_pedido
        INNER JOIN productos p ON dp.id_producto = p.id_producto
        WHERE pe.id_productor = ?
        GROUP BY p.id_producto, p.nombre, p.precio
        ORDER BY cantidad_vendida DESC
        LIMIT 10
      `, [userId]);

      // Ventas del mes actual
      const ventasMesActual = await conexion.query(`
        SELECT 
          COALESCE(SUM(total), 0) as total_ventas,
          COUNT(*) as total_pedidos
        FROM pedidos
        WHERE id_productor = ?
          AND DATE_FORMAT(fecha_pedido, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
      `, [userId]);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas: {
          total_pedidos: totalPedidos[0]?.total || 0,
          total_ventas: totalVentas[0]?.total || 0,
          pedidos_por_estado: pedidosPorEstado,
          ventas_por_mes: ventasPorMes,
          productos_mas_vendidos: productosMasVendidos,
          ventas_mes_actual: {
            total_ventas: ventasMesActual[0]?.total_ventas || 0,
            total_pedidos: ventasMesActual[0]?.total_pedidos || 0
          }
        }
      };
    } catch (error) {
      console.error("Error en ObtenerMisVentas:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "ERROR_INTERNO",
        message: "Error interno del servidor."
      };
    }
  }
}
