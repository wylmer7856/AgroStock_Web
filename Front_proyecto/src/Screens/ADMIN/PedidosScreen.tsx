// 📦 PANTALLA DE GESTIÓN DE PEDIDOS - ADMIN

import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Input, Modal, Loading, Badge } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import './AdminScreens.css';

interface Pedido {
  id_pedido: number;
  id_consumidor: number;
  id_productor: number;
  fecha_pedido: string;
  estado: string;
  estado_pago: string;
  total: number;
  direccion_entrega: string;
  notas?: string;
  fecha_entrega_estimada?: string;
  metodo_pago: string;
  nombre_consumidor?: string;
  nombre_productor?: string;
  email_consumidor?: string;
  email_productor?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
}

interface PedidosScreenProps {
  onNavigate: (view: string) => void;
}

// Funciones helper
const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(cantidad);
};

const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return 'N/A';
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
};

const obtenerMes = (fecha: string): string => {
  if (!fecha) return 'N/A';
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  } catch {
    return 'N/A';
  }
};

export const PedidosScreen: React.FC<PedidosScreenProps> = ({ onNavigate }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    cargarPedidos();
    
    // Actualización automática cada 30 segundos
    const interval = setInterval(() => {
      cargarPedidos();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, busquedaDebounced]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getPedidos(filtroEstado !== 'todos' ? filtroEstado : undefined);
      
      let pedidosData: Pedido[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        pedidosData = response.data;
      } else if (response.data && Array.isArray((response.data as any).pedidos)) {
        pedidosData = (response.data as any).pedidos;
      } else if ((response as any).pedidos && Array.isArray((response as any).pedidos)) {
        pedidosData = (response as any).pedidos;
      }
      
      // Filtrar por búsqueda
      if (busquedaDebounced) {
        pedidosData = pedidosData.filter((p: Pedido) => 
          p.id_pedido.toString().includes(busquedaDebounced) ||
          p.nombre_consumidor?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
          p.nombre_productor?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
          p.ciudad_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase())
        );
      }
      
      setPedidos(pedidosData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('[PedidosScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPedido = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el pedido y todos sus datos relacionados. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera mientras se elimina el pedido',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await adminService.eliminarPedido(id);
      
      if (response.success) {
        await cargarPedidos();
        
        Swal.fire({
          icon: 'success',
          title: '¡Pedido eliminado!',
          text: 'El pedido y todos sus datos relacionados han sido eliminados correctamente.',
          confirmButtonColor: '#059669'
        });
        
        setShowDeleteModal(false);
        setPedidoSeleccionado(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error eliminando pedido',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error eliminando pedido:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error eliminando pedido: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', label: string }> = {
      'pendiente': { variant: 'warning', label: 'Pendiente' },
      'confirmado': { variant: 'info', label: 'Confirmado' },
      'en_preparacion': { variant: 'info', label: 'En Preparación' },
      'en_camino': { variant: 'info', label: 'En Camino' },
      'entregado': { variant: 'success', label: 'Entregado' },
      'cancelado': { variant: 'error', label: 'Cancelado' }
    };
    
    const estadoInfo = estados[estado] || { variant: 'info' as const, label: estado };
    return <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>;
  };

  const getPagoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'success' | 'warning' | 'error', label: string }> = {
      'pendiente': { variant: 'warning', label: 'Pendiente' },
      'pagado': { variant: 'success', label: 'Pagado' },
      'aprobado': { variant: 'success', label: 'Aprobado' },
      'reembolsado': { variant: 'error', label: 'Reembolsado' },
      'rechazado': { variant: 'error', label: 'Rechazado' }
    };
    
    const estadoInfo = estados[estado] || { variant: 'info' as const, label: estado };
    return <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>;
  };

  // ===== ESTADÍSTICAS =====
  const estadisticas = useMemo(() => {
    const total = pedidos.length;
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const entregados = pedidos.filter(p => p.estado === 'entregado').length;
    const cancelados = pedidos.filter(p => p.estado === 'cancelado').length;
    const totalIngresos = pedidos
      .filter(p => p.estado === 'entregado' && (p.estado_pago === 'pagado' || p.estado_pago === 'aprobado'))
      .reduce((sum, p) => sum + p.total, 0);

    // Pedidos por mes
    const porMes: Record<string, number> = {};
    pedidos.forEach(p => {
      const mes = obtenerMes(p.fecha_pedido);
      if (mes !== 'N/A') {
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });
    const datosPorMes = Object.entries(porMes)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6) // Últimos 6 meses
      .map(([mes, cantidad]) => ({
        mes: mes.length > 15 ? mes.substring(0, 15) + '...' : mes,
        cantidad
      }));

    // Pedidos por ciudad
    const porCiudad: Record<string, number> = {};
    pedidos.forEach(p => {
      const ciudad = p.ciudad_nombre || 'Sin ciudad';
      porCiudad[ciudad] = (porCiudad[ciudad] || 0) + 1;
    });
    const datosPorCiudad = Object.entries(porCiudad)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 ciudades
      .map(([ciudad, cantidad]) => ({
        ciudad: ciudad.length > 20 ? ciudad.substring(0, 20) + '...' : ciudad,
        cantidad
      }));

    // Distribución por estado
    const datosPorEstado = [
      { name: 'Pendientes', value: pendientes, color: '#ffc107' },
      { name: 'Entregados', value: entregados, color: '#059669' },
      { name: 'Cancelados', value: cancelados, color: '#dc3545' },
      { name: 'En Proceso', value: total - pendientes - entregados - cancelados, color: '#3b82f6' }
    ].filter(item => item.value > 0);

    // Top 5 pedidos por valor
    const topPedidos = [...pedidos]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(p => ({
        id: `#${p.id_pedido}`,
        total: p.total
      }));

    // Pedidos por método de pago
    const porMetodoPago: Record<string, number> = {};
    pedidos.forEach(p => {
      const metodo = p.metodo_pago || 'N/A';
      porMetodoPago[metodo] = (porMetodoPago[metodo] || 0) + 1;
    });
    const datosPorMetodoPago = Object.entries(porMetodoPago).map(([metodo, cantidad]) => ({
      metodo: metodo.charAt(0).toUpperCase() + metodo.slice(1),
      cantidad
    }));

    return {
      total,
      pendientes,
      entregados,
      cancelados,
      totalIngresos,
      datosPorMes,
      datosPorCiudad,
      datosPorEstado,
      topPedidos,
      datosPorMetodoPago
    };
  }, [pedidos]);

  const COLORS = ['#059669', '#10b981', '#3b82f6', '#ffc107', '#dc3545', '#8b5cf6'];

  return (
    <div className="pedidos-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-cart-check me-2"></i>
            Gestión de Pedidos
          </h1>
          <p>Administra todos los pedidos del sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="pedidos-filters-card">
        <div className="pedidos-filters-container">
          <div className="pedidos-search-wrapper">
            <div className="search-icon-wrapper">
              <i className="bi bi-search"></i>
            </div>
            <input
              type="text"
              className="pedidos-search-input"
              placeholder="Buscar por ID, consumidor, productor o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                className="clear-search-btn"
                onClick={() => setBusqueda('')}
                type="button"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}
          </div>

          <div className="pedidos-filters-row">
            <div className="pedidos-filter-item">
              <label className="pedidos-filter-label">
                <i className="bi bi-funnel me-2"></i>
                Estado:
              </label>
              <select
                className="pedidos-filter-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_preparacion">En Preparación</option>
                <option value="en_camino">En Camino</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de pedidos */}
      <Card className="pedidos-table-card">
        {loading ? (
          <Loading text="Cargando pedidos..." />
        ) : error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <Button variant="primary" onClick={cargarPedidos}>
              Reintentar
            </Button>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No se encontraron pedidos</h3>
            <p>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="pedidos-table-wrapper">
              <table className="table pedidos-table">
                <thead>
                  <tr>
                    <th className="th-id">ID</th>
                    <th className="th-fecha">FECHA</th>
                    <th className="th-consumidor">CONSUMIDOR</th>
                    <th className="th-productor">PRODUCTOR</th>
                    <th className="th-ciudad">CIUDAD</th>
                    <th className="th-total">TOTAL</th>
                    <th className="th-estado">ESTADO</th>
                    <th className="th-pago">PAGO</th>
                    <th className="th-acciones">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td className="td-id">
                        <span className="pedido-id-text">#{pedido.id_pedido}</span>
                      </td>
                      <td className="td-fecha">
                        <span className="pedido-fecha-text">{formatearFecha(pedido.fecha_pedido)}</span>
                      </td>
                      <td className="td-consumidor">
                        <div className="pedido-participante-cell">
                          <span className="pedido-participante-text">{pedido.nombre_consumidor || `Usuario ${pedido.id_consumidor}`}</span>
                          {pedido.email_consumidor && (
                            <span className="pedido-email-text">{pedido.email_consumidor}</span>
                          )}
                        </div>
                      </td>
                      <td className="td-productor">
                        <div className="pedido-participante-cell">
                          <span className="pedido-participante-text">{pedido.nombre_productor || `Usuario ${pedido.id_productor}`}</span>
                          {pedido.email_productor && (
                            <span className="pedido-email-text">{pedido.email_productor}</span>
                          )}
                        </div>
                      </td>
                      <td className="td-ciudad">
                        <span className="pedido-ciudad-text">
                          {pedido.ciudad_nombre ? `${pedido.ciudad_nombre}, ${pedido.departamento_nombre || ''}` : 'N/A'}
                        </span>
                      </td>
                      <td className="td-total">
                        <span className="pedido-total-text">{formatearMoneda(pedido.total)}</span>
                      </td>
                      <td className="td-estado">
                        {getEstadoBadge(pedido.estado)}
                      </td>
                      <td className="td-pago">
                        {getPagoBadge(pedido.estado_pago || 'pendiente')}
                      </td>
                      <td className="td-acciones">
                        <div className="pedidos-acciones-buttons">
                          <button
                            className="btn btn-accion-view"
                            onClick={() => {
                              setPedidoSeleccionado(pedido);
                              setShowDetailsModal(true);
                            }}
                            title="Ver detalles"
                          >
                            <i className="bi bi-eye-fill"></i>
                          </button>
                          <button
                            className="btn btn-accion-delete"
                            onClick={() => {
                              setPedidoSeleccionado(pedido);
                              setShowDeleteModal(true);
                            }}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Mostrando 1 - {pedidos.length} de {pedidos.length} pedidos</span>
            </div>
          </>
        )}
      </Card>

      {/* Gráficas estadísticas */}
      {pedidos.length > 0 && (
        <div className="pedidos-graficas-container">
          <div className="estadisticas-resumen estadisticas-resumen-full">
            <div className="resumen-stats">
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                  <i className="bi bi-cart-check"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.total}</div>
                  <div className="stat-label">Total Pedidos</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)' }}>
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.pendientes}</div>
                  <div className="stat-label">Pendientes</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.entregados}</div>
                  <div className="stat-label">Entregados</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}>
                  <i className="bi bi-currency-dollar"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatearMoneda(estadisticas.totalIngresos)}</div>
                  <div className="stat-label">Ingresos Totales</div>
                </div>
              </div>
            </div>
          </div>

          <div className="graficas-grid">
            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-calendar-month me-2"></i>Pedidos por Mes</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={estadisticas.datosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cantidad" stroke="#059669" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-geo-alt me-2"></i>Top 5 Ciudades con Más Pedidos</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.datosPorCiudad}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ciudad" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-pie-chart me-2"></i>Distribución por Estado</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadisticas.datosPorEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadisticas.datosPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-trophy me-2"></i>Top 5 Pedidos por Valor</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.topPedidos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="id" type="category" width={80} />
                  <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                  <Legend />
                  <Bar dataKey="total" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-credit-card me-2"></i>Pedidos por Método de Pago</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.datosPorMetodoPago}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metodo" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del pedido */}
      {showDetailsModal && pedidoSeleccionado && (
        <PedidoDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setPedidoSeleccionado(null);
          }}
          pedido={pedidoSeleccionado}
        />
      )}

      {/* Modal para eliminar pedido */}
      {showDeleteModal && pedidoSeleccionado && (
        <DeletePedidoModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPedidoSeleccionado(null);
          }}
          pedido={pedidoSeleccionado}
          onConfirm={() => handleEliminarPedido(pedidoSeleccionado.id_pedido)}
        />
      )}
    </div>
  );
};

// ===== MODAL PARA VER DETALLES DEL PEDIDO =====
interface PedidoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
}

const PedidoDetailsModal: React.FC<PedidoDetailsModalProps> = ({
  isOpen,
  onClose,
  pedido
}) => {
  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', label: string }> = {
      'pendiente': { variant: 'warning', label: 'Pendiente' },
      'confirmado': { variant: 'info', label: 'Confirmado' },
      'en_preparacion': { variant: 'info', label: 'En Preparación' },
      'en_camino': { variant: 'info', label: 'En Camino' },
      'entregado': { variant: 'success', label: 'Entregado' },
      'cancelado': { variant: 'error', label: 'Cancelado' }
    };
    
    const estadoInfo = estados[estado] || { variant: 'info' as const, label: estado };
    return <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>;
  };

  const getPagoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'success' | 'warning' | 'error', label: string }> = {
      'pendiente': { variant: 'warning', label: 'Pendiente' },
      'pagado': { variant: 'success', label: 'Pagado' },
      'aprobado': { variant: 'success', label: 'Aprobado' },
      'reembolsado': { variant: 'error', label: 'Reembolsado' },
      'rechazado': { variant: 'error', label: 'Rechazado' }
    };
    
    const estadoInfo = estados[estado] || { variant: 'info' as const, label: estado };
    return <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          <i className="bi bi-cart-check me-2"></i>
          Detalles del Pedido: #{pedido.id_pedido}
        </span>
      }
      size="large"
    >
      <div className="pedido-details-modal-content">
        <div className="pedido-details-section">
          <h3 className="pedido-details-title">
            <i className="bi bi-info-circle me-2"></i>
            Información General
          </h3>
          <div className="pedido-details-grid">
            <div className="detail-row">
              <span className="detail-label">ID del Pedido:</span>
              <span className="detail-value">#{pedido.id_pedido}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha del Pedido:</span>
              <span className="detail-value">{formatearFecha(pedido.fecha_pedido)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total:</span>
              <span className="detail-value price">{formatearMoneda(pedido.total)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado:</span>
              <span className="detail-value">{getEstadoBadge(pedido.estado)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado de Pago:</span>
              <span className="detail-value">{getPagoBadge(pedido.estado_pago || 'pendiente')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Método de Pago:</span>
              <span className="detail-value">{pedido.metodo_pago || 'N/A'}</span>
            </div>
            {pedido.fecha_entrega_estimada && (
              <div className="detail-row">
                <span className="detail-label">Fecha de Entrega Estimada:</span>
                <span className="detail-value">{formatearFecha(pedido.fecha_entrega_estimada)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pedido-details-section">
          <h3 className="pedido-details-title">
            <i className="bi bi-person me-2"></i>
            Información del Consumidor
          </h3>
          <div className="pedido-details-grid">
            <div className="detail-row">
              <span className="detail-label">Nombre:</span>
              <span className="detail-value">{pedido.nombre_consumidor || `Usuario ${pedido.id_consumidor}`}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{pedido.email_consumidor || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="pedido-details-section">
          <h3 className="pedido-details-title">
            <i className="bi bi-person-badge me-2"></i>
            Información del Productor
          </h3>
          <div className="pedido-details-grid">
            <div className="detail-row">
              <span className="detail-label">Nombre:</span>
              <span className="detail-value">{pedido.nombre_productor || `Usuario ${pedido.id_productor}`}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{pedido.email_productor || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="pedido-details-section">
          <h3 className="pedido-details-title">
            <i className="bi bi-geo-alt me-2"></i>
            Información de Entrega
          </h3>
          <div className="pedido-details-grid">
            <div className="detail-row">
              <span className="detail-label">Dirección:</span>
              <span className="detail-value">{pedido.direccion_entrega || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ciudad:</span>
              <span className="detail-value">
                {pedido.ciudad_nombre ? `${pedido.ciudad_nombre}, ${pedido.departamento_nombre || ''}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {pedido.notas && (
          <div className="pedido-details-section">
            <h3 className="pedido-details-title">
              <i className="bi bi-sticky me-2"></i>
              Notas
            </h3>
            <div className="pedido-details-grid">
              <div className="detail-row">
                <span className="detail-value">{pedido.notas}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pedido-details-actions">
          <Button variant="primary" onClick={onClose}>
            <i className="bi bi-x-circle me-2"></i>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ===== MODAL PARA ELIMINAR PEDIDO =====
interface DeletePedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
  onConfirm: () => void;
}

const DeletePedidoModal: React.FC<DeletePedidoModalProps> = ({
  isOpen,
  onClose,
  pedido,
  onConfirm
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          <i className="bi bi-trash me-2"></i>
          Eliminar Pedido
        </span>
      }
      size="medium"
    >
      <div className="delete-pedido-modal">
        <div className="pedido-preview">
          <div className="preview-info">
            <h3>Pedido #{pedido.id_pedido}</h3>
            <p><strong>Consumidor:</strong> {pedido.nombre_consumidor || `Usuario ${pedido.id_consumidor}`}</p>
            <p><strong>Productor:</strong> {pedido.nombre_productor || `Usuario ${pedido.id_productor}`}</p>
            <p><strong>Total:</strong> {formatearMoneda(pedido.total)}</p>
            <p><strong>Estado:</strong> {pedido.estado}</p>
            <p><strong>Fecha:</strong> {formatearFecha(pedido.fecha_pedido)}</p>
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
          >
            <i className="bi bi-trash-fill me-2"></i>
            Eliminar Pedido
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PedidosScreen;
