// PANTALLA DE GESTIÓN DE RESEÑAS - ADMIN

import React, { useState, useEffect, useMemo } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading, Badge, Input } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface Resena {
  id_resena: number;
  id_pedido: number | null;
  id_producto: number;
  id_consumidor: number;
  id_productor: number;
  nombre_consumidor?: string;
  nombre_productor?: string;
  nombre_producto?: string;
  calificacion: number;
  comentario?: string | null;
  fecha_resena: string;
}

interface ResenasScreenProps {
  onNavigate: (view: string) => void;
}

export const ResenasScreen: React.FC<ResenasScreenProps> = ({ onNavigate }) => {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCalificacion, setFiltroCalificacion] = useState<number | null>(null);

  useEffect(() => {
    cargarResenas();
  }, []);

  const cargarResenas = async () => {
    try {
      setLoading(true);
      const response = await adminService.getResenas();
      if (response.success && response.data) {
        setResenas(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando reseñas', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id_resena: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.eliminarResena(id_resena);
        if (response.success) {
          setResenas(prev => prev.filter(r => r.id_resena !== id_resena));
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Reseña eliminada', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error eliminando reseña', confirmButtonColor: '#2d5016' });
      }
    }
  };

  // Filtrar reseñas
  const resenasFiltradas = useMemo(() => {
    let filtradas = resenas;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(r => 
        r.nombre_consumidor?.toLowerCase().includes(busquedaLower) ||
        r.nombre_productor?.toLowerCase().includes(busquedaLower) ||
        r.nombre_producto?.toLowerCase().includes(busquedaLower) ||
        r.comentario?.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por calificación
    if (filtroCalificacion !== null) {
      filtradas = filtradas.filter(r => r.calificacion === filtroCalificacion);
    }

    return filtradas;
  }, [resenas, busqueda, filtroCalificacion]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = resenas.length;
    const promedio = total > 0 
      ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / total).toFixed(1)
      : '0.0';
    const porCalificacion = [1, 2, 3, 4, 5].map(cal => ({
      calificacion: cal,
      cantidad: resenas.filter(r => r.calificacion === cal).length
    }));

    return { total, promedio, porCalificacion };
  }, [resenas]);

  const renderStars = (calificacion: number) => {
    return '⭐'.repeat(calificacion) + '☆'.repeat(5 - calificacion);
  };

  const getCalificacionColor = (calificacion: number) => {
    if (calificacion >= 4) return '#10b981'; // Verde
    if (calificacion >= 3) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-star-fill me-2"></i>
            Gestión de Reseñas
          </h1>
          <p>Administra todas las reseñas del sistema</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card>
            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon" style={{ background: '#3b82f6' }}>
                  📊
                </div>
                <div>
                  <div className="metric-value">{estadisticas.total}</div>
                  <div className="metric-label">Total Reseñas</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <div className="metric-card">
              <div className="metric-content">
                <div className="metric-icon" style={{ background: '#10b981' }}>
                  ⭐
                </div>
                <div>
                  <div className="metric-value">{estadisticas.promedio}</div>
                  <div className="metric-label">Calificación Promedio</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-6">
          <Card>
            <div className="metric-card">
              <div className="metric-content">
                <div style={{ width: '100%' }}>
                  <div className="metric-label mb-2">Distribución por Calificación</div>
                  <div className="d-flex gap-2 align-items-center">
                    {estadisticas.porCalificacion.map(stat => (
                      <div key={stat.calificacion} className="text-center" style={{ flex: 1 }}>
                        <div className="fw-bold">{stat.calificacion}⭐</div>
                        <div className="text-muted small">{stat.cantidad}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <div style={{ flex: '1 1 300px' }}>
            <label className="form-label">
              <i className="bi bi-search me-2"></i>
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Buscar por consumidor, productor, producto o comentario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div style={{ flex: '0 0 200px' }}>
            <label className="form-label">
              <i className="bi bi-funnel me-2"></i>
              Calificación
            </label>
            <select
              className="form-select"
              value={filtroCalificacion === null ? '' : filtroCalificacion}
              onChange={(e) => setFiltroCalificacion(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">Todas</option>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                setBusqueda('');
                setFiltroCalificacion(null);
              }}
            >
              <i className="bi bi-x-circle me-2"></i>
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Reseñas */}
      <Card>
        <div className="usuarios-table-container">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <strong>Mostrando {resenasFiltradas.length} de {resenas.length} reseñas</strong>
            </div>
            <Button
              variant="primary"
              onClick={cargarResenas}
              loading={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Actualizar
            </Button>
          </div>
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Consumidor</th>
                <th>Productor</th>
                <th>Producto</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resenasFiltradas.map((resena) => (
                <tr key={resena.id_resena}>
                  <td>{resena.id_resena}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="user-avatar-small">
                        {resena.nombre_consumidor?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span>{resena.nombre_consumidor || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="user-avatar-small" style={{ background: '#10b981' }}>
                        {resena.nombre_productor?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span>{resena.nombre_productor || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant="info">{resena.nombre_producto || 'N/A'}</Badge>
                  </td>
                  <td>
                    <div 
                      className="d-flex align-items-center gap-2"
                      style={{ color: getCalificacionColor(resena.calificacion) }}
                    >
                      <strong>{resena.calificacion}</strong>
                      <span>{renderStars(resena.calificacion)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {resena.comentario || <span className="text-muted">Sin comentario</span>}
                    </div>
                  </td>
                  <td>{new Date(resena.fecha_resena).toLocaleDateString('es-CO', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</td>
                  <td>
                    <Button 
                      size="small" 
                      variant="danger" 
                      onClick={() => handleEliminar(resena.id_resena)}
                      title="Eliminar reseña"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resenasFiltradas.length === 0 && (
            <div className="empty-state">
              {resenas.length === 0 
                ? 'No hay reseñas en el sistema' 
                : 'No se encontraron reseñas con los filtros aplicados'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

