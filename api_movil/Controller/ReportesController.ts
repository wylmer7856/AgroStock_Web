import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { ReportesModel, ReporteCreateData } from "../Models/ReportesModel.ts";

export class ReportesController {
  
  // 📌 Crear reporte (basado en estructura real de BD)
  static async CrearReporte(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_elemento_reportado, tipo_elemento, tipo_reporte, descripcion } = body;
      const userId = ctx.state.user.id;

      if (!tipo_reporte || !descripcion || !tipo_elemento) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      if (!id_elemento_reportado) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Debe especificar el elemento reportado" };
        return;
      }

      // Validar que tipo_reporte sea uno de los valores permitidos
      const tiposPermitidos = ['producto_inapropiado', 'usuario_inapropiado', 'contenido_ofensivo', 'spam', 'fraude', 'otro'];
      if (!tiposPermitidos.includes(tipo_reporte)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Tipo de reporte inválido" };
        return;
      }

      const reporteData: ReporteCreateData = {
        id_usuario_reportante: userId,
        tipo_reporte: tipo_reporte as ReporteCreateData['tipo_reporte'],
        id_elemento_reportado: id_elemento_reportado,
        tipo_elemento: tipo_elemento as 'producto' | 'usuario',
        descripcion
      };

      const reporteModel = new ReportesModel(reporteData);
      const result = await reporteModel.CrearReporte();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en CrearReporte:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener todos los reportes (solo admin)
  static async ObtenerTodosLosReportes(ctx: Context) {
    try {
      const estado = ctx.request.url.searchParams.get('estado');
      const tipo = ctx.request.url.searchParams.get('tipo');
      const reporteModel = new ReportesModel();

      let reportes;
      if (estado) {
        reportes = await reporteModel.ObtenerReportesPorEstado(estado);
      } else if (tipo) {
        reportes = await reporteModel.ObtenerReportesPorTipo(tipo);
      } else {
        reportes = await reporteModel.ObtenerTodosLosReportes();
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerTodosLosReportes:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener reportes por estado
  static async ObtenerReportesPorEstado(ctx: RouterContext<"/reportes/estado/:estado">) {
    try {
      const { estado } = ctx.params;
      const reporteModel = new ReportesModel();
      const reportes = await reporteModel.ObtenerReportesPorEstado(estado);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerReportesPorEstado:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener reportes por tipo
  static async ObtenerReportesPorTipo(ctx: RouterContext<"/reportes/tipo/:tipo">) {
    try {
      const { tipo } = ctx.params;
      const reporteModel = new ReportesModel();
      const reportes = await reporteModel.ObtenerReportesPorTipo(tipo);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        reportes,
        total: reportes.length
      };
    } catch (error) {
      console.error("Error en ObtenerReportesPorTipo:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Actualizar estado del reporte (solo admin)
  static async ActualizarEstadoReporte(ctx: RouterContext<"/reportes/:id_reporte/estado">) {
    try {
      const { id_reporte } = ctx.params;
      const body = await ctx.request.body.json();
      const { estado, accion_tomada } = body;

      if (!id_reporte || !estado) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del reporte y estado son requeridos" };
        return;
      }

      const estadosValidos = ['pendiente', 'en_revision', 'resuelto', 'rechazado'];
      if (!estadosValidos.includes(estado)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Estado inválido" };
        return;
      }

      const reporteModel = new ReportesModel();
      const result = await reporteModel.ActualizarEstadoReporte(parseInt(id_reporte), estado, accion_tomada);

      if (result.success) {
        ctx.response.status = 200;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ActualizarEstadoReporte:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Eliminar reporte resuelto (solo admin)
  static async EliminarReporteResuelto(ctx: RouterContext<"/reportes/:id_reporte">) {
    try {
      const { id_reporte } = ctx.params;

      if (!id_reporte) {
        ctx.response.status = 400;
        ctx.response.body = { error: "ID del reporte requerido" };
        return;
      }

      const reporteModel = new ReportesModel();
      const result = await reporteModel.EliminarReporteResuelto(parseInt(id_reporte));

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
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Obtener estadísticas de reportes (solo admin)
  static async ObtenerEstadisticasReportes(ctx: Context) {
    try {
      const reporteModel = new ReportesModel();
      const estadisticas = await reporteModel.ObtenerEstadisticasReportes();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        estadisticas
      };
    } catch (error) {
      console.error("Error en ObtenerEstadisticasReportes:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Reportar usuario
  static async ReportarUsuario(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_usuario_reportado, motivo, descripcion } = body;
      const userId = ctx.state.user.id;

      if (!id_usuario_reportado || !motivo || !descripcion) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      if (id_usuario_reportado === userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "No puedes reportarte a ti mismo" };
        return;
      }

      // Validar y mapear el tipo de reporte
      const tiposPermitidos: Array<'producto_inapropiado' | 'usuario_inapropiado' | 'contenido_ofensivo' | 'spam' | 'fraude' | 'otro'> = 
        ['producto_inapropiado', 'usuario_inapropiado', 'contenido_ofensivo', 'spam', 'fraude', 'otro'];
      const tipoReporte = tiposPermitidos.includes(motivo as typeof tiposPermitidos[number]) 
        ? (motivo as typeof tiposPermitidos[number])
        : 'usuario_inapropiado';

      const reporteData: ReporteCreateData = {
        id_usuario_reportante: userId,
        tipo_reporte: tipoReporte,
        id_elemento_reportado: id_usuario_reportado,
        tipo_elemento: 'usuario',
        descripcion
      };

      const reporteModel = new ReportesModel(reporteData);
      const result = await reporteModel.CrearReporte();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ReportarUsuario:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }

  // 📌 Reportar producto
  static async ReportarProducto(ctx: Context) {
    try {
      const body = await ctx.request.body.json();
      const { id_producto_reportado, motivo, descripcion } = body;
      const userId = ctx.state.user.id;

      if (!id_producto_reportado || !motivo || !descripcion) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Faltan campos requeridos" };
        return;
      }

      // Validar y mapear el tipo de reporte
      const tiposPermitidos: Array<'producto_inapropiado' | 'usuario_inapropiado' | 'contenido_ofensivo' | 'spam' | 'fraude' | 'otro'> = 
        ['producto_inapropiado', 'usuario_inapropiado', 'contenido_ofensivo', 'spam', 'fraude', 'otro'];
      const tipoReporte = tiposPermitidos.includes(motivo as typeof tiposPermitidos[number]) 
        ? (motivo as typeof tiposPermitidos[number])
        : 'producto_inapropiado';

      const reporteData: ReporteCreateData = {
        id_usuario_reportante: userId,
        tipo_reporte: tipoReporte,
        id_elemento_reportado: id_producto_reportado,
        tipo_elemento: 'producto',
        descripcion
      };

      const reporteModel = new ReportesModel(reporteData);
      const result = await reporteModel.CrearReporte();

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = result;
      } else {
        ctx.response.status = 400;
        ctx.response.body = result;
      }
    } catch (error) {
      console.error("Error en ReportarProducto:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Error interno del servidor" };
    }
  }
}
