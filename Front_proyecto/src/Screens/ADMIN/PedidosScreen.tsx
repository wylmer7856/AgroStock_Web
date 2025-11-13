// PANTALLA DE GESTIÓN DE PEDIDOS - ADMIN

import React, { useState, useEffect } from 'react';
import { usePagination, useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Input, Modal, Loading, Badge, Toast } from '../../components/ReusableComponents';
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
}

interface PedidosScreenProps {
  onNavigate: (view: string) => void;
}

export const PedidosScreen: React.FC<PedidosScreenProps> = ({ onNavigate }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado, busquedaDebounced]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[PedidosScreen] Cargando pedidos...');
      const response = await adminService.getPedidos();
      console.log('[PedidosScreen] Respuesta recibida:', response);
      
      if (response.success && response.data) {
        let pedidosFiltrados = response.data;
        
        // Filtrar por estado
        if (filtroEstado !== 'todos') {
          pedidosFiltrados = pedidosFiltrados.filter((p: Pedido) => p.estado === filtroEstado);
        }
        
        // Filtrar por búsqueda
        if (busquedaDebounced) {
          pedidosFiltrados = pedidosFiltrados.filter((p: Pedido) => 
            p.id_pedido.toString().includes(busquedaDebounced) ||
            p.nombre_consumidor?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            p.nombre_productor?.toLowerCase().includes(busquedaDebounced.toLowerCase())
          );
        }
        
        setPedidos(pedidosFiltrados);
        console.log('[PedidosScreen] Pedidos cargados:', pedidosFiltrados.length);
      } else {
        setError(response.message || 'Error cargando pedidos');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[PedidosScreen] Excepción:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!pedidoSeleccionado || !nuevoEstado) return;
    
    try {
      const response = await adminService.actualizarEstadoPedido(
        pedidoSeleccionado.id_pedido,
        nuevoEstado
      );
      
      if (response.success) {
        setPedidos(prev => 
          prev.map(p => 
            p.id_pedido === pedidoSeleccionado.id_pedido 
              ? { ...p, estado: nuevoEstado }
              : p
          )
        );
        mostrarToast('Estado del pedido actualizado', 'success');
        setShowEstadoModal(false);
        setPedidoSeleccionado(null);
        setNuevoEstado('');
      } else {
        mostrarToast(response.message || 'Error actualizando estado', 'error');
      }
    } catch (err) {
      mostrarToast('Error actualizando estado del pedido', 'error');
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', label: string }> = {
      'pendiente': { variant: 'warning', label: 'Pendiente' },
      'confirmado': { variant: 'info', label: 'Confirmado' },
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
      'aprobado': { variant: 'success', label: 'Aprobado' },
      'rechazado': { variant: 'error', label: 'Rechazado' }
    };
    
    const estadoInfo = estados[estado] || { variant: 'info' as const, label: estado };
    return <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>;
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Pedidos</h1>
          <p>Administra todos los pedidos del sistema</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={cargarPedidos}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="error-card" style={{ marginBottom: '20px' }}>
          <div style={{ padding: '15px' }}>
            <strong>Error:</strong> {error}
            <br />
            <Button
              variant="secondary"
              size="small"
              onClick={cargarPedidos}
              style={{ marginTop: '10px' }}
            >
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Buscar por ID, consumidor o productor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_camino">En Camino</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de pedidos */}
      {loading ? (
        <Loading />
      ) : pedidos.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No se encontraron pedidos</p>
          </div>
        </Card>
      ) : (
        <div className="pedidos-cards-grid">
          {pedidos.map((pedido) => (
            <Card key={pedido.id_pedido} className="pedido-card">
              <div className="pedido-card-header">
                <div>
                  <div className="pedido-id">#{pedido.id_pedido}</div>
                  <div className="pedido-fecha">{formatearFecha(pedido.fecha_pedido)}</div>
                </div>
                <div className="pedido-total">{formatearMoneda(pedido.total)}</div>
              </div>

              <div className="pedido-card-body">
                <div className="pedido-participantes">
                  <div className="participante-item">
                    <div className="participante-label">Consumidor</div>
                    <div className="participante-nombre">
                      {pedido.nombre_consumidor || `Usuario ${pedido.id_consumidor}`}
                    </div>
                    {pedido.email_consumidor && (
                      <div className="participante-contacto">{pedido.email_consumidor}</div>
                    )}
                  </div>
                  <div className="participante-item">
                    <div className="participante-label">Productor</div>
                    <div className="participante-nombre">
                      {pedido.nombre_productor || `Usuario ${pedido.id_productor}`}
                    </div>
                    {pedido.email_productor && (
                      <div className="participante-contacto">{pedido.email_productor}</div>
                    )}
                  </div>
                </div>

                <div className="pedido-info-grid">
                  <div className="pedido-info-item">
                    <div className="pedido-info-label">Estado</div>
                    <div className="pedido-info-value">{getEstadoBadge(pedido.estado)}</div>
                  </div>
                  <div className="pedido-info-item">
                    <div className="pedido-info-label">Pago</div>
                    <div className="pedido-info-value">{getPagoBadge(pedido.estado_pago || 'pendiente')}</div>
                  </div>
                </div>

                {pedido.direccion_entrega && (
                  <div className="pedido-info-item" style={{ marginTop: '1rem' }}>
                    <div className="pedido-info-label">Dirección de Entrega</div>
                    <div className="pedido-info-value" style={{ fontSize: '0.875rem', fontWeight: 400 }}>
                      {pedido.direccion_entrega}
                    </div>
                  </div>
                )}

                {pedido.notas && (
                  <div className="pedido-info-item" style={{ marginTop: '1rem' }}>
                    <div className="pedido-info-label">Notas</div>
                    <div className="pedido-info-value" style={{ fontSize: '0.875rem', fontWeight: 400 }}>
                      {pedido.notas}
                    </div>
                  </div>
                )}
              </div>

              <div className="pedido-card-footer">
                <div className="pedido-metodo-pago">
                  <span className="pedido-info-label">Método:</span>
                  <span className="pedido-info-value" style={{ fontSize: '0.875rem' }}>
                    {pedido.metodo_pago || 'N/A'}
                  </span>
                </div>
                <Button
                  size="small"
                  variant="primary"
                  onClick={() => {
                    setPedidoSeleccionado(pedido);
                    setNuevoEstado(pedido.estado);
                    setShowEstadoModal(true);
                  }}
                >
                  Cambiar Estado
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para cambiar estado */}
      {showEstadoModal && pedidoSeleccionado && (
        <Modal
          isOpen={showEstadoModal}
          onClose={() => {
            setShowEstadoModal(false);
            setPedidoSeleccionado(null);
            setNuevoEstado('');
          }}
          title="Cambiar Estado del Pedido"
        >
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem' }}>
              Pedido #{pedidoSeleccionado.id_pedido} - {formatearMoneda(pedidoSeleccionado.total)}
            </p>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Nuevo Estado
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_camino">En Camino</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEstadoModal(false);
                  setPedidoSeleccionado(null);
                  setNuevoEstado('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCambiarEstado}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

