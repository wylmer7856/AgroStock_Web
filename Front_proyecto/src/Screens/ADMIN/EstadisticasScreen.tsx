// 📊 PANTALLA DE ESTADÍSTICAS - ADMIN - MEJORADA CON DESCARGAS

import React, { useState, useEffect, useMemo } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading, Badge, Toast } from '../../components/ReusableComponents';
import type { EstadisticasGenerales, ActividadReciente } from '../../types';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgenjs from 'pptxgenjs';
import './AdminScreens.css';

interface EstadisticasScreenProps {
  onNavigate: (view: string) => void;
}

const COLORS = ['#2d5016', '#3d6b1f', '#4a7c23', '#5a8d2a', '#6a9e31', '#7aaf38', '#8ac03f', '#9ad146'];

export const EstadisticasScreen: React.FC<EstadisticasScreenProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'dia' | 'semana' | 'mes' | 'año'>('mes');
  const [descargando, setDescargando] = useState<{ tipo: 'pdf' | 'excel' | 'powerpoint' | null }>({ tipo: null });

  // ===== EFECTOS =====
  useEffect(() => {
    cargarEstadisticas();
    cargarActividadReciente();
  }, [periodoSeleccionado]);

  // Auto-actualizar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarEstadisticas();
      cargarActividadReciente();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [periodoSeleccionado]);

  // ===== FUNCIONES =====
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getEstadisticasGenerales(periodoSeleccionado);
      
      const datos = response.data || response.estadisticas;
      
      if (response.success && datos) {
        setEstadisticas(datos);
      } else {
        setError(response.message || 'Error cargando estadísticas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const cargarActividadReciente = async () => {
    try {
      const response = await adminService.getActividadReciente();
      if (response.success && response.data) {
        setActividadReciente(response.data);
      }
    } catch (err) {
      console.error('Error cargando actividad reciente:', err);
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const formatearNumero = (numero: number) => {
    return numero.toLocaleString('es-CO');
  };

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  // ===== FUNCIONES DE DESCARGA =====

  // Descargar PDF
  const descargarPDF = async () => {
    if (!estadisticas) {
      mostrarToast('No hay datos para exportar', 'error');
      return;
    }

    try {
      setDescargando({ tipo: 'pdf' });
      const doc = new jsPDF();
      
      // Encabezado con diseño mejorado
      doc.setFillColor(45, 80, 22);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Estadísticas', 105, 18, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('AgroStock - Sistema de Gestión Agrícola', 105, 28, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 105, 35, { align: 'center' });
      
      let yPos = 50;
      
      // Resumen General con diseño mejorado
      doc.setFillColor(240, 248, 255);
      doc.rect(10, yPos - 5, 190, 8, 'F');
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 80, 22);
      doc.text('📊 Resumen General', 14, yPos);
      yPos += 12;

      const resumenData = [
        ['Métrica', 'Valor'],
        ['Total Usuarios', formatearNumero(estadisticas.total_usuarios)],
        ['Total Productos', formatearNumero(estadisticas.total_productos)],
        ['Total Pedidos', formatearNumero(estadisticas.total_pedidos)],
        ['Ingresos Totales', formatearMoneda(estadisticas.ingresos_totales)],
        ['Pedidos Completados', formatearNumero(estadisticas.pedidos_completados || 0)],
        ['Pedidos Pendientes', formatearNumero(estadisticas.pedidos_pendientes || 0)],
        ['Pedidos Cancelados', formatearNumero(estadisticas.pedidos_cancelados || 0)],
      ];

      autoTable(doc, {
        head: [resumenData[0]],
        body: resumenData.slice(1),
        startY: yPos,
        theme: 'striped',
        headStyles: { 
          fillColor: [45, 80, 22], 
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 11
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [33, 37, 41]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Usuarios por Rol con diseño mejorado
      if (estadisticas.usuarios_por_rol) {
        yPos = (doc as any).lastAutoTable.finalY + 20;
        
        doc.setFillColor(240, 248, 255);
        doc.rect(10, yPos - 5, 190, 8, 'F');
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 80, 22);
        doc.text('👥 Usuarios por Rol', 14, yPos);
        yPos += 12;

        const usuariosRolData = [
          ['Rol', 'Cantidad'],
          ['Administradores', formatearNumero(estadisticas.usuarios_por_rol.admin || 0)],
          ['Productores', formatearNumero(estadisticas.usuarios_por_rol.productor || 0)],
          ['Consumidores', formatearNumero(estadisticas.usuarios_por_rol.consumidor || 0)],
        ];

        autoTable(doc, {
          head: [usuariosRolData[0]],
          body: usuariosRolData.slice(1),
          startY: yPos,
          theme: 'striped',
          headStyles: { 
            fillColor: [45, 80, 22], 
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 11
          },
          bodyStyles: {
            fontSize: 10,
            textColor: [33, 37, 41]
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Productos por Categoría con diseño mejorado
      if (estadisticas.productos_por_categoria && estadisticas.productos_por_categoria.length > 0) {
        yPos = (doc as any).lastAutoTable.finalY + 20;
        
        // Verificar si necesitamos una nueva página
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFillColor(240, 248, 255);
        doc.rect(10, yPos - 5, 190, 8, 'F');
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 80, 22);
        doc.text('🛍️ Productos por Categoría', 14, yPos);
        yPos += 12;

        const productosCategoriaData = [
          ['Categoría', 'Cantidad'],
          ...estadisticas.productos_por_categoria.map(cat => [
            cat.nombre || cat.categoria || 'Sin categoría',
            formatearNumero(cat.total || cat.cantidad || 0)
          ])
        ];

        autoTable(doc, {
          head: [productosCategoriaData[0]],
          body: productosCategoriaData.slice(1),
          startY: yPos,
          theme: 'striped',
          headStyles: { 
            fillColor: [45, 80, 22], 
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 11
          },
          bodyStyles: {
            fontSize: 10,
            textColor: [33, 37, 41]
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: 14, right: 14 }
        });
      }

      // Guardar PDF
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`Estadisticas_AgroStock_${fecha}.pdf`);
      mostrarToast('PDF exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      mostrarToast('Error al exportar a PDF', 'error');
    } finally {
      setDescargando({ tipo: null });
    }
  };

  // Descargar Excel
  const descargarExcel = () => {
    if (!estadisticas) {
      mostrarToast('No hay datos para exportar', 'error');
      return;
    }

    try {
      setDescargando({ tipo: 'excel' });
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen General
      const resumenData = [
        ['Métrica', 'Valor'],
        ['Total Usuarios', estadisticas.total_usuarios],
        ['Total Productos', estadisticas.total_productos],
        ['Total Pedidos', estadisticas.total_pedidos],
        ['Ingresos Totales', estadisticas.ingresos_totales],
        ['Pedidos Completados', estadisticas.pedidos_completados || 0],
        ['Pedidos Pendientes', estadisticas.pedidos_pendientes || 0],
        ['Pedidos Cancelados', estadisticas.pedidos_cancelados || 0],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen General');

      // Hoja 2: Usuarios por Rol
      const usuariosRolData = [
        ['Rol', 'Cantidad'],
        ['Administradores', estadisticas.usuarios_por_rol?.admin || 0],
        ['Productores', estadisticas.usuarios_por_rol?.productor || 0],
        ['Consumidores', estadisticas.usuarios_por_rol?.consumidor || 0],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(usuariosRolData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Usuarios por Rol');

      // Hoja 3: Productos por Categoría
      const productosCategoriaData = [
        ['Categoría', 'Cantidad'],
        ...(estadisticas.productos_por_categoria?.map(cat => [
          cat.nombre || cat.categoria || 'Sin categoría',
          cat.total || cat.cantidad || 0
        ]) || [])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(productosCategoriaData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Productos por Categoría');

      // Hoja 4: Actividad Reciente
      if (actividadReciente.length > 0) {
        const actividadData = [
          ['Tipo', 'Descripción', 'Usuario', 'Fecha'],
          ...actividadReciente.map(act => [
            act.tipo,
            act.descripcion,
            act.usuario || 'Sistema',
            new Date(act.timestamp).toLocaleString('es-CO')
          ])
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(actividadData);
        XLSX.utils.book_append_sheet(wb, ws4, 'Actividad Reciente');
      }

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Estadisticas_AgroStock_${fecha}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);
      mostrarToast('Archivo Excel exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      mostrarToast('Error al exportar a Excel', 'error');
    } finally {
      setDescargando({ tipo: null });
    }
  };

  // Descargar PowerPoint
  const descargarPowerPoint = async () => {
    if (!estadisticas) {
      mostrarToast('No hay datos para exportar', 'error');
      return;
    }

    try {
      setDescargando({ tipo: 'powerpoint' });
      const pptx = new pptxgenjs();

      // Configuración general
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'AgroStock';
      pptx.company = 'AgroStock';
      pptx.title = 'Reporte de Estadísticas';

      // Slide 1: Portada
      const slide1 = pptx.addSlide();
      slide1.addText('Reporte de Estadísticas', {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1,
        fontSize: 44,
        bold: true,
        color: '2d5016',
        align: 'center',
      });
      slide1.addText('AgroStock', {
        x: 0.5,
        y: 2.8,
        w: 9,
        h: 0.8,
        fontSize: 32,
        color: '3d6b1f',
        align: 'center',
      });
      slide1.addText(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, {
        x: 0.5,
        y: 4,
        w: 9,
        h: 0.5,
        fontSize: 18,
        color: '666666',
        align: 'center',
      });

      // Slide 2: Resumen General
      const slide2 = pptx.addSlide();
      slide2.addText('Resumen General', {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.6,
        fontSize: 32,
        bold: true,
        color: '2d5016',
      });

      const resumenText = [
        `Total Usuarios: ${formatearNumero(estadisticas.total_usuarios)}`,
        `Total Productos: ${formatearNumero(estadisticas.total_productos)}`,
        `Total Pedidos: ${formatearNumero(estadisticas.total_pedidos)}`,
        `Ingresos Totales: ${formatearMoneda(estadisticas.ingresos_totales)}`,
        `Pedidos Completados: ${formatearNumero(estadisticas.pedidos_completados || 0)}`,
        `Pedidos Pendientes: ${formatearNumero(estadisticas.pedidos_pendientes || 0)}`,
        `Pedidos Cancelados: ${formatearNumero(estadisticas.pedidos_cancelados || 0)}`,
      ].join('\n');

      slide2.addText(resumenText, {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 4,
        fontSize: 20,
        bullet: true,
        color: '333333',
      });

      // Slide 3: Usuarios por Rol
      if (estadisticas.usuarios_por_rol) {
        const slide3 = pptx.addSlide();
        slide3.addText('Usuarios por Rol', {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.6,
          fontSize: 32,
          bold: true,
          color: '2d5016',
        });

        const usuariosText = [
          `Administradores: ${formatearNumero(estadisticas.usuarios_por_rol.admin || 0)}`,
          `Productores: ${formatearNumero(estadisticas.usuarios_por_rol.productor || 0)}`,
          `Consumidores: ${formatearNumero(estadisticas.usuarios_por_rol.consumidor || 0)}`,
        ].join('\n');

        slide3.addText(usuariosText, {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 4,
          fontSize: 24,
          bullet: true,
          color: '333333',
        });
      }

      // Slide 4: Productos por Categoría
      if (estadisticas.productos_por_categoria && estadisticas.productos_por_categoria.length > 0) {
        const slide4 = pptx.addSlide();
        slide4.addText('Productos por Categoría', {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.6,
          fontSize: 32,
          bold: true,
          color: '2d5016',
        });

        const categoriasText = estadisticas.productos_por_categoria
          .map(cat => `${cat.nombre || cat.categoria || 'Sin categoría'}: ${formatearNumero(cat.total || cat.cantidad || 0)}`)
          .join('\n');

        slide4.addText(categoriasText, {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 4,
          fontSize: 20,
          bullet: true,
          color: '333333',
        });
      }

      const fecha = new Date().toISOString().split('T')[0];
      await pptx.writeFile({ fileName: `Estadisticas_AgroStock_${fecha}.pptx` });
      mostrarToast('PowerPoint exportado correctamente', 'success');
    } catch (error) {
      console.error('Error exportando a PowerPoint:', error);
      mostrarToast('Error al exportar a PowerPoint', 'error');
    } finally {
      setDescargando({ tipo: null });
    }
  };

  // Datos para gráficas
  const datosGraficas = useMemo(() => {
    if (!estadisticas) return null;

    return {
      usuariosPorRol: [
        { name: 'Admin', value: estadisticas.usuarios_por_rol?.admin || 0 },
        { name: 'Productores', value: estadisticas.usuarios_por_rol?.productor || 0 },
        { name: 'Consumidores', value: estadisticas.usuarios_por_rol?.consumidor || 0 },
      ],
      productosPorCategoria: estadisticas.productos_por_categoria?.map(cat => ({
        name: cat.nombre || cat.categoria || 'Sin categoría',
        cantidad: cat.total || cat.cantidad || 0
      })) || [],
      pedidosPorEstado: [
        { name: 'Completados', value: estadisticas.pedidos_completados || 0 },
        { name: 'Pendientes', value: estadisticas.pedidos_pendientes || 0 },
        { name: 'Cancelados', value: estadisticas.pedidos_cancelados || 0 },
      ],
      metricasComparativas: [
        { name: 'Usuarios', valor: estadisticas.total_usuarios },
        { name: 'Productos', valor: estadisticas.total_productos },
        { name: 'Pedidos', valor: estadisticas.total_pedidos },
      ]
    };
  }, [estadisticas]);

  return (
    <div className="screen-container estadisticas-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>📈 Estadísticas Generales</h1>
          <p>Métricas y análisis completo de la plataforma</p>
        </div>
        <div className="header-actions">
          <div className="periodo-selector">
            <label>Período:</label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value as any)}
            >
              <option value="dia">📅 Hoy</option>
              <option value="semana">📊 Esta semana</option>
              <option value="mes">📈 Este mes</option>
              <option value="año">📆 Este año</option>
            </select>
          </div>
          <div className="download-buttons">
            <Button
              className="download-btn download-btn-pdf"
              variant="primary"
              onClick={descargarPDF}
              disabled={!estadisticas || descargando.tipo !== null}
              loading={descargando.tipo === 'pdf'}
            >
              <span className="download-icon">📄</span>
              <span className="download-text">PDF</span>
            </Button>
            <Button
              className="download-btn download-btn-excel"
              variant="primary"
              onClick={descargarExcel}
              disabled={!estadisticas || descargando.tipo !== null}
              loading={descargando.tipo === 'excel'}
            >
              <span className="download-icon">📊</span>
              <span className="download-text">Excel</span>
            </Button>
            <Button
              className="download-btn download-btn-powerpoint"
              variant="primary"
              onClick={descargarPowerPoint}
              disabled={!estadisticas || descargando.tipo !== null}
              loading={descargando.tipo === 'powerpoint'}
            >
              <span className="download-icon">📽️</span>
              <span className="download-text">PowerPoint</span>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Loading text="Cargando estadísticas..." />
        </div>
      ) : error ? (
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>❌ {error}</p>
          <Button variant="primary" onClick={cargarEstadisticas}>
            Reintentar
          </Button>
        </div>
      ) : estadisticas ? (
        <>
          {/* Métricas principales */}
          <div className="metrics-grid">
            <Card className="metric-card primary">
              <div className="metric-content">
                <div className="metric-icon">👥</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearNumero(estadisticas.total_usuarios)}</div>
                  <div className="metric-label">Total Usuarios</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card success">
              <div className="metric-content">
                <div className="metric-icon">🛍️</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearNumero(estadisticas.total_productos)}</div>
                  <div className="metric-label">Total Productos</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card warning">
              <div className="metric-content">
                <div className="metric-icon">📦</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearNumero(estadisticas.total_pedidos)}</div>
                  <div className="metric-label">Total Pedidos</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card info">
              <div className="metric-content">
                <div className="metric-icon">💰</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearMoneda(estadisticas.ingresos_totales)}</div>
                  <div className="metric-label">Ingresos Totales</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Gráficas */}
          {datosGraficas && (
            <div className="estadisticas-graficas-container">
              {/* Gráfica de Usuarios por Rol - Pastel */}
              <Card title="Distribución de Usuarios por Rol" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosGraficas.usuariosPorRol}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosGraficas.usuariosPorRol.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfica de Productos por Categoría - Barras */}
              {datosGraficas.productosPorCategoria.length > 0 && (
                <Card title="Productos por Categoría" className="grafica-card">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosGraficas.productosPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#2d5016" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Gráfica de Pedidos por Estado - Pastel */}
              <Card title="Pedidos por Estado" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosGraficas.pedidosPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosGraficas.pedidosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfica Comparativa - Barras */}
              <Card title="Comparativa General" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGraficas.metricasComparativas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valor" fill="#3d6b1f" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfica de Área - Tendencias */}
              {actividadReciente.length > 0 && (
                <Card title="Tendencias de Actividad" className="grafica-card">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={actividadReciente.slice(0, 10).map((act, idx) => ({
                      fecha: new Date(act.timestamp).toLocaleDateString('es-CO'),
                      actividad: idx + 1
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="actividad" stroke="#2d5016" fill="#3d6b1f" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Gráfica de Líneas - Comparativa */}
              <Card title="Comparativa de Métricas" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosGraficas.metricasComparativas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="valor" stroke="#2d5016" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Estadísticas detalladas */}
          <div className="detailed-stats-grid">
            {/* Usuarios por rol */}
            <Card title="Usuarios por Rol" className="stats-card">
              <div className="role-stats">
                <div className="role-item">
                  <div className="role-icon">👨‍💼</div>
                  <div className="role-info">
                    <div className="role-name">Administradores</div>
                    <div className="role-count">{formatearNumero(estadisticas.usuarios_por_rol?.admin || 0)}</div>
                  </div>
                  <div className="role-percentage">
                    {estadisticas.total_usuarios > 0 ? 
                      Math.round(((estadisticas.usuarios_por_rol?.admin || 0) / estadisticas.total_usuarios) * 100) : 0}%
                  </div>
                </div>
                
                <div className="role-item">
                  <div className="role-icon">🌱</div>
                  <div className="role-info">
                    <div className="role-name">Productores</div>
                    <div className="role-count">{formatearNumero(estadisticas.usuarios_por_rol?.productor || 0)}</div>
                  </div>
                  <div className="role-percentage">
                    {estadisticas.total_usuarios > 0 ? 
                      Math.round(((estadisticas.usuarios_por_rol?.productor || 0) / estadisticas.total_usuarios) * 100) : 0}%
                  </div>
                </div>
                
                <div className="role-item">
                  <div className="role-icon">🛒</div>
                  <div className="role-info">
                    <div className="role-name">Consumidores</div>
                    <div className="role-count">{formatearNumero(estadisticas.usuarios_por_rol?.consumidor || 0)}</div>
                  </div>
                  <div className="role-percentage">
                    {estadisticas.total_usuarios > 0 ? 
                      Math.round(((estadisticas.usuarios_por_rol?.consumidor || 0) / estadisticas.total_usuarios) * 100) : 0}%
                  </div>
                </div>
              </div>
            </Card>

            {/* Productos por categoría */}
            <Card title="Productos por Categoría" className="stats-card">
              <div className="category-stats">
                {estadisticas.productos_por_categoria?.map((categoria, index) => (
                  <div key={index} className="category-item">
                    <div className="category-name">{categoria.nombre || categoria.categoria || 'Sin categoría'}</div>
                    <div className="category-count">{formatearNumero(categoria.total || categoria.cantidad || 0)}</div>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ 
                          width: `${estadisticas.total_productos > 0 ? ((categoria.total || categoria.cantidad || 0) / estadisticas.total_productos) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )) || (
                  <div className="no-data">No hay datos de categorías disponibles</div>
                )}
              </div>
            </Card>

            {/* Estadísticas de pedidos */}
            <Card title="Estadísticas de Pedidos" className="stats-card">
              <div className="order-stats">
                <div className="order-item">
                  <div className="order-icon">📦</div>
                  <div className="order-info">
                    <div className="order-name">Pedidos Completados</div>
                    <div className="order-count">{formatearNumero(estadisticas.pedidos_completados || 0)}</div>
                  </div>
                </div>
                
                <div className="order-item">
                  <div className="order-icon">⏳</div>
                  <div className="order-info">
                    <div className="order-name">Pedidos Pendientes</div>
                    <div className="order-count">{formatearNumero(estadisticas.pedidos_pendientes || 0)}</div>
                  </div>
                </div>
                
                <div className="order-item">
                  <div className="order-icon">❌</div>
                  <div className="order-info">
                    <div className="order-name">Pedidos Cancelados</div>
                    <div className="order-count">{formatearNumero(estadisticas.pedidos_cancelados || 0)}</div>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Actividad reciente */}
          <Card title="Actividad Reciente" className="activity-card">
            <div className="activity-list">
              {actividadReciente.length === 0 ? (
                <div className="no-activity">
                  <div className="no-activity-icon">📊</div>
                  <h3>No hay actividad reciente</h3>
                  <p>Las actividades aparecerán aquí cuando los usuarios interactúen con la plataforma.</p>
                </div>
              ) : (
                actividadReciente.map((actividad, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {actividad.tipo === 'usuario_registrado' && '👤'}
                      {actividad.tipo === 'producto_creado' && '🛍️'}
                      {actividad.tipo === 'pedido_realizado' && '📦'}
                      {actividad.tipo === 'reporte_creado' && '📋'}
                      {actividad.tipo === 'mensaje_enviado' && '💬'}
                      {actividad.tipo === 'reseña_creada' && '⭐'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">{actividad.descripcion}</div>
                      <div className="activity-meta">
                        <span className="activity-user">{actividad.usuario || 'Sistema'}</span>
                        <span className="activity-time">{new Date(actividad.timestamp).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="activity-badge">
                      <Badge variant="info" size="small">
                        {actividad.tipo.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No hay datos de estadísticas disponibles</p>
          <Button variant="primary" onClick={cargarEstadisticas}>
            Cargar Estadísticas
          </Button>
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EstadisticasScreen;
