// 📋 PANTALLA DE GESTIÓN DE REPORTES - ADMIN

import React, { useState, useEffect } from 'react';
import { useApi, usePagination, useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Input, Modal, Loading, Badge, Avatar, Toast } from '../../components/ReusableComponents';
import type { ReporteDetallado, FiltrosReportes } from '../../types';
import './AdminScreens.css';

interface ReportesScreenProps {
  onNavigate: (view: string) => void;
}

export const ReportesScreen: React.FC<ReportesScreenProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const [reportes, setReportes] = useState<ReporteDetallado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosReportes>({});
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteDetallado | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ===== PAGINACIÓN =====
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 20,
    total: reportes.length
  });

  // ===== DEBOUNCE PARA BÚSQUEDA =====
  const busquedaDebounced = useDebounce(busqueda, 300);

  // ===== EFECTOS =====
  useEffect(() => {
    cargarReportes();
  }, [filtros, busquedaDebounced]);

  // ===== FUNCIONES =====
  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosCompletos = {
        ...filtros,
        ...(busquedaDebounced && { descripcion: busquedaDebounced })
      };
      
      console.log('[ReportesScreen] Cargando reportes con filtros:', filtrosCompletos);
      const response = await adminService.getReportes(filtrosCompletos);
      console.log('[ReportesScreen] Respuesta recibida:', response);
      
      if (response.success && response.data) {
        setReportes(response.data);
        console.log('[ReportesScreen] Reportes cargados:', response.data.length);
      } else {
        const errorMsg = response.message || 'Error cargando reportes';
        console.error('[ReportesScreen] Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[ReportesScreen] Excepción:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResolverReporte = async (id: number, accionTomada: string, estado: string = 'resuelto') => {
    try {
      // ✅ Pasar parámetros en el orden correcto: id, accionTomada, estado
      const response = await adminService.resolverReporte(id, accionTomada, estado);
      
      if (response.success) {
        setReportes(prev => 
          prev.map(r => r.id_reporte === id ? { ...r, estado: 'resuelto', accion_tomada: accionTomada } : r)
        );
        mostrarToast('Reporte resuelto exitosamente', 'success');
        setShowResolveModal(false);
        setReporteSeleccionado(null);
      } else {
        mostrarToast(response.message || 'Error resolviendo reporte', 'error');
      }
    } catch (err) {
      mostrarToast('Error resolviendo reporte', 'error');
    }
  };

  const handleEliminarReporte = async (id: number) => {
    try {
      const response = await adminService.eliminarReporteResuelto(id);
      
      if (response.success) {
        setReportes(prev => prev.filter(r => r.id_reporte !== id));
        mostrarToast('Reporte eliminado exitosamente', 'success');
        setShowDeleteModal(false);
        setReporteSeleccionado(null);
      } else {
        mostrarToast(response.message || 'Error eliminando reporte', 'error');
      }
    } catch (err) {
      mostrarToast('Error eliminando reporte', 'error');
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const reportesFiltrados = reportes.filter(reporte =>
    !busquedaDebounced || 
    reporte.descripcion?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    reporte.tipo_reporte?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    reporte.nombre_reportador?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    reporte.elemento_reportado?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'producto_inapropiado': return '🚫';
      case 'usuario_inapropiado': return '👤';
      case 'contenido_ofensivo': return '⚠️';
      case 'spam': return '📧';
      case 'fraude': return '💰';
      case 'otro': return '📝';
      default: return '📋';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente': return 'warning';
      case 'resuelto': return 'success';
      case 'rechazado': return 'error';
      default: return 'info';
    }
  };

  return (
    <div className="reportes-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Reportes</h1>
          <p>Administra reportes y moderación de contenido</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button
            variant="secondary"
            icon="🔄"
            onClick={cargarReportes}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <div className="stat-number">{reportes.length}</div>
              <div className="stat-label">Total Reportes</div>
            </div>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-number">
                {reportes.filter(r => r.estado === 'pendiente').length}
              </div>
              <div className="stat-label">Pendientes</div>
            </div>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-number">
                {reportes.filter(r => r.estado === 'resuelto').length}
              </div>
              <div className="stat-label">Resueltos</div>
            </div>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <div className="stat-number">
                {reportes.filter(r => r.estado === 'rechazado').length}
              </div>
              <div className="stat-label">Rechazados</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card title="Filtros y Búsqueda" className="filters-card">
        <div className="filters-grid">
          <div className="search-group">
            <Input
              label="Buscar reportes"
              placeholder="Descripción, tipo o reportador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              icon="🔍"
            />
          </div>
          
          <div className="filter-group">
            <label>Tipo de reporte:</label>
            <select
              value={filtros.tipo_reporte || ''}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                tipo_reporte: e.target.value || undefined
              }))}
            >
              <option value="">Todos los tipos</option>
              <option value="producto_inapropiado">🚫 Producto Inapropiado</option>
              <option value="usuario_inapropiado">👤 Usuario Inapropiado</option>
              <option value="contenido_ofensivo">⚠️ Contenido Ofensivo</option>
              <option value="spam">📧 Spam</option>
              <option value="fraude">💰 Fraude</option>
              <option value="otro">📝 Otro</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filtros.estado || ''}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                estado: e.target.value || undefined
              }))}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="resuelto">✅ Resuelto</option>
              <option value="rechazado">❌ Rechazado</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ordenar por:</label>
            <select
              value={filtros.orden || ''}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                orden: e.target.value as any || undefined
              }))}
            >
              <option value="">Sin orden</option>
              <option value="fecha_desc">Más recientes</option>
              <option value="fecha_asc">Más antiguos</option>
              <option value="estado_asc">Estado A-Z</option>
              <option value="tipo_asc">Tipo A-Z</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de reportes */}
      <Card 
        title={`Reportes encontrados (${reportesFiltrados.length})`}
        className="reportes-list-card"
      >
        {loading ? (
          <Loading text="Cargando reportes..." />
        ) : error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <Button variant="primary" onClick={cargarReportes}>
              Reintentar
            </Button>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No se encontraron reportes</h3>
            <p>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="reportes-list">
            {reportesFiltrados.map((reporte) => (
              <div key={reporte.id_reporte} className="reporte-item">
                {/* Header del reporte */}
                <div className="reporte-header">
                  <div className="reporte-tipo">
                    <span className="tipo-icon">{getTipoIcon(reporte.tipo_reporte)}</span>
                    <span className="tipo-nombre">{reporte.tipo_reporte.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="reporte-estado">
                    <Badge 
                      variant={getEstadoColor(reporte.estado)}
                      size="medium"
                    >
                      {reporte.estado === 'pendiente' && '⏳'}
                      {reporte.estado === 'resuelto' && '✅'}
                      {reporte.estado === 'rechazado' && '❌'}
                      {' '}{reporte.estado}
                    </Badge>
                  </div>
                </div>

                {/* Contenido del reporte */}
                <div className="reporte-content">
                  <div className="reporte-descripcion">
                    <h4>Descripción del reporte:</h4>
                    <p>{reporte.descripcion}</p>
                  </div>

                  {/* Información del reportador */}
                  <div className="reportador-info">
                    <div className="reportador-header">
                      <Avatar name={reporte.nombre_reportador} size="small" />
                      <div className="reportador-details">
                        <div className="reportador-nombre">{reporte.nombre_reportador}</div>
                        <div className="reportador-contacto">
                          📧 {reporte.email_reportador}
                        </div>
                        <div className="reportador-fecha">
                          📅 {new Date(reporte.fecha_reporte).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información del elemento reportado */}
                  {reporte.elemento_reportado && (
                    <div className="elemento-reportado">
                      <h4>Elemento reportado:</h4>
                      <div className="elemento-info">
                        <div className="elemento-tipo">
                          <Badge variant="info" size="small">
                            {reporte.tipo_elemento_display || (reporte.tipo_elemento === 'producto' ? 'Producto' : 'Usuario')}
                          </Badge>
                        </div>
                        <div className="elemento-descripcion">
                          {reporte.elemento_reportado}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acción tomada (si está resuelto) */}
                  {reporte.estado === 'resuelto' && reporte.accion_tomada && (
                    <div className="accion-tomada">
                      <h4>Acción tomada:</h4>
                      <p>{reporte.accion_tomada}</p>
                      <div className="accion-fecha">
                        Resuelto el: {new Date(reporte.fecha_resolucion).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="reporte-actions">
                  {reporte.estado === 'pendiente' && (
                    <>
                      <Button
                        size="small"
                        variant="success"
                        icon="✅"
                        onClick={() => {
                          setReporteSeleccionado(reporte);
                          setShowResolveModal(true);
                        }}
                      >
                        Resolver
                      </Button>
                      <Button
                        size="small"
                        variant="error"
                        icon="❌"
                        onClick={() => {
                          if (confirm('¿Estás seguro de rechazar este reporte?')) {
                            handleResolverReporte(reporte.id_reporte, 'Reporte rechazado por el administrador', 'rechazado');
                          }
                        }}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                  
                  {reporte.estado === 'resuelto' && (
                    <Button
                      size="small"
                      variant="danger"
                      icon="🗑️"
                      onClick={() => {
                        setReporteSeleccionado(reporte);
                        setShowDeleteModal(true);
                      }}
                    >
                      Eliminar Resuelto
                    </Button>
                  )}
                  
                  <Button
                    size="small"
                    variant="secondary"
                    icon="👁️"
                    onClick={() => {
                      // Aquí podrías abrir un modal con detalles completos
                      alert(`Detalles del reporte: ${reporte.descripcion}`);
                    }}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Paginación */}
      {reportesFiltrados.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, reportesFiltrados.length)} de {reportesFiltrados.length} reportes
          </div>
          <div className="pagination-controls">
            <Button
              size="small"
              variant="secondary"
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage}
            >
              ← Anterior
            </Button>
            <span className="pagination-page">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <Button
              size="small"
              variant="secondary"
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* Modal para resolver reporte */}
      {showResolveModal && reporteSeleccionado && (
        <ResolveReportModal
          isOpen={showResolveModal}
          onClose={() => {
            setShowResolveModal(false);
            setReporteSeleccionado(null);
          }}
          reporte={reporteSeleccionado}
          onConfirm={(accionTomada) => {
            handleResolverReporte(reporteSeleccionado.id_reporte, accionTomada);
          }}
        />
      )}

      {/* Modal para eliminar reporte resuelto */}
      {showDeleteModal && reporteSeleccionado && (
        <DeleteReportModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setReporteSeleccionado(null);
          }}
          reporte={reporteSeleccionado}
          onConfirm={() => {
            handleEliminarReporte(reporteSeleccionado.id_reporte);
          }}
        />
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

// ===== MODAL PARA RESOLVER REPORTE =====
interface ResolveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: ReporteDetallado;
  onConfirm: (accionTomada: string) => void;
}

const ResolveReportModal: React.FC<ResolveReportModalProps> = ({
  isOpen,
  onClose,
  reporte,
  onConfirm
}) => {
  const [accionTomada, setAccionTomada] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accionTomada.trim()) {
      alert('Por favor, describe la acción tomada');
      return;
    }

    setLoading(true);
    onConfirm(accionTomada);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolver Reporte"
      size="large"
    >
      <div className="resolve-report-modal">
        <div className="reporte-preview">
          <h3>Reporte #{reporte.id_reporte}</h3>
          <div className="preview-content">
            <div className="preview-item">
              <strong>Tipo:</strong> {reporte.tipo_reporte}
            </div>
            <div className="preview-item">
              <strong>Reportador:</strong> {reporte.nombre_reportador}
            </div>
            <div className="preview-item">
              <strong>Fecha:</strong> {new Date(reporte.fecha_reporte).toLocaleString()}
            </div>
            <div className="preview-item">
              <strong>Descripción:</strong>
              <p>{reporte.descripcion}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Acción tomada:</label>
            <textarea
              value={accionTomada}
              onChange={(e) => setAccionTomada(e.target.value)}
              placeholder="Describe las acciones que tomaste para resolver este reporte..."
              required
              rows={4}
            />
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={loading}
              icon="✅"
            >
              Marcar como Resuelto
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// ===== MODAL PARA ELIMINAR REPORTE RESUELTO =====
interface DeleteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: ReporteDetallado;
  onConfirm: () => void;
}

const DeleteReportModal: React.FC<DeleteReportModalProps> = ({
  isOpen,
  onClose,
  reporte,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    onConfirm();
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Reporte Resuelto"
      size="medium"
    >
      <div className="delete-report-modal">
        <div className="warning-message">
          <div className="warning-icon">⚠️</div>
          <h3>¿Estás seguro?</h3>
          <p>Esta acción eliminará permanentemente el reporte resuelto #{reporte.id_reporte}.</p>
          <p>Esta acción no se puede deshacer.</p>
        </div>

        <div className="reporte-info">
          <div className="info-item">
            <strong>Tipo:</strong> {reporte.tipo_reporte}
          </div>
          <div className="info-item">
            <strong>Reportador:</strong> {reporte.nombre_reportador}
          </div>
          <div className="info-item">
            <strong>Fecha:</strong> {new Date(reporte.fecha_reporte).toLocaleString()}
          </div>
          {reporte.accion_tomada && (
            <div className="info-item">
              <strong>Acción tomada:</strong> {reporte.accion_tomada}
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={loading}
            icon="🗑️"
            onClick={handleConfirm}
          >
            Eliminar Definitivamente
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportesScreen;




