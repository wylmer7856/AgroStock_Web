// 📊 PANTALLA DE ESTADÍSTICAS - ADMIN

import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Loading, Badge, Toast } from '../../components/ReusableComponents';
import type { EstadisticasGenerales, ActividadReciente } from '../../types';
import './AdminScreens.css';

interface EstadisticasScreenProps {
  onNavigate: (view: string) => void;
}

export const EstadisticasScreen: React.FC<EstadisticasScreenProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'dia' | 'semana' | 'mes' | 'año'>('mes');

  // ===== EFECTOS =====
  useEffect(() => {
    cargarEstadisticas();
    cargarActividadReciente();
  }, [periodoSeleccionado]);

  // ===== FUNCIONES =====
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Pasar el período como parámetro al servicio
      const response = await adminService.getEstadisticasGenerales(periodoSeleccionado);
      
      if (response.success && response.data) {
        setEstadisticas(response.data);
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

  const calcularPorcentajeCambio = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
  };

  const getIconoCambio = (porcentaje: number) => {
    if (porcentaje > 0) return '📈';
    if (porcentaje < 0) return '📉';
    return '➡️';
  };

  const getColorCambio = (porcentaje: number) => {
    if (porcentaje > 0) return 'success';
    if (porcentaje < 0) return 'error';
    return 'info';
  };

  return (
    <div className="estadisticas-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>Estadísticas Generales</h1>
          <p>Métricas y análisis de la plataforma</p>
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
          <Button
            variant="secondary"
            icon="🔄"
            onClick={() => {
              cargarEstadisticas();
              cargarActividadReciente();
            }}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading text="Cargando estadísticas..." />
      ) : error ? (
        <div className="error-message">
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
                  {estadisticas.usuarios_nuevos !== undefined && (
                    <div className="metric-change">
                      <Badge 
                        variant={getColorCambio(estadisticas.usuarios_nuevos)}
                        size="small"
                      >
                        {getIconoCambio(estadisticas.usuarios_nuevos)} {estadisticas.usuarios_nuevos > 0 ? '+' : ''}{estadisticas.usuarios_nuevos}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="metric-card success">
              <div className="metric-content">
                <div className="metric-icon">🛍️</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearNumero(estadisticas.total_productos)}</div>
                  <div className="metric-label">Total Productos</div>
                  {estadisticas.productos_nuevos !== undefined && (
                    <div className="metric-change">
                      <Badge 
                        variant={getColorCambio(estadisticas.productos_nuevos)}
                        size="small"
                      >
                        {getIconoCambio(estadisticas.productos_nuevos)} {estadisticas.productos_nuevos > 0 ? '+' : ''}{estadisticas.productos_nuevos}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="metric-card warning">
              <div className="metric-content">
                <div className="metric-icon">📦</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearNumero(estadisticas.total_pedidos)}</div>
                  <div className="metric-label">Total Pedidos</div>
                  {estadisticas.pedidos_nuevos !== undefined && (
                    <div className="metric-change">
                      <Badge 
                        variant={getColorCambio(estadisticas.pedidos_nuevos)}
                        size="small"
                      >
                        {getIconoCambio(estadisticas.pedidos_nuevos)} {estadisticas.pedidos_nuevos > 0 ? '+' : ''}{estadisticas.pedidos_nuevos}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="metric-card info">
              <div className="metric-content">
                <div className="metric-icon">💰</div>
                <div className="metric-info">
                  <div className="metric-number">{formatearMoneda(estadisticas.ingresos_totales)}</div>
                  <div className="metric-label">Ingresos Totales</div>
                  {estadisticas.ingresos_periodo !== undefined && (
                    <div className="metric-change">
                      <Badge 
                        variant={getColorCambio(estadisticas.ingresos_periodo)}
                        size="small"
                      >
                        {getIconoCambio(estadisticas.ingresos_periodo)} {formatearMoneda(estadisticas.ingresos_periodo)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

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
                    <div className="category-name">{categoria.nombre}</div>
                    <div className="category-count">{formatearNumero(categoria.total)}</div>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ 
                          width: `${estadisticas.total_productos > 0 ? (categoria.total / estadisticas.total_productos) * 100 : 0}%` 
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

            {/* Métricas de rendimiento */}
            <Card title="Métricas de Rendimiento" className="stats-card">
              <div className="performance-stats">
                <div className="performance-item">
                  <div className="performance-label">Tasa de Conversión</div>
                  <div className="performance-value">
                    {estadisticas.tasa_conversion ? `${estadisticas.tasa_conversion.toFixed(2)}%` : 'N/A'}
                  </div>
                </div>
                
                <div className="performance-item">
                  <div className="performance-label">Ticket Promedio</div>
                  <div className="performance-value">
                    {estadisticas.ticket_promedio ? formatearMoneda(estadisticas.ticket_promedio) : 'N/A'}
                  </div>
                </div>
                
                <div className="performance-item">
                  <div className="performance-label">Productos por Usuario</div>
                  <div className="performance-value">
                    {estadisticas.productos_por_usuario ? estadisticas.productos_por_usuario.toFixed(1) : 'N/A'}
                  </div>
                </div>
                
                <div className="performance-item">
                  <div className="performance-label">Pedidos por Usuario</div>
                  <div className="performance-value">
                    {estadisticas.pedidos_por_usuario ? estadisticas.pedidos_por_usuario.toFixed(1) : 'N/A'}
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
                        <span className="activity-user">{actividad.usuario}</span>
                        <span className="activity-time">{new Date(actividad.timestamp).toLocaleString()}</span>
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
      ) : null}

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




