// 📦 PÁGINA DE PEDIDOS PARA PRODUCTOR

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { pedidosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  BiReceipt, 
  BiPackage, 
  BiCheckCircle, 
  BiXCircle, 
  BiTime, 
  BiFilter,
  BiSearch,
  BiArrowBack,
  BiUser,
  BiMapPin,
  BiPhone,
  BiEnvelope,
  BiDollar,
  BiCreditCard
} from 'react-icons/bi';
import type { Pedido } from '../../types';

const ProductorPedidosPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Query para pedidos del productor
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos', 'productor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('productor', user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  // Mutation para actualizar estado del pedido
  const actualizarEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      return await pedidosService.actualizarEstado(id, estado as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'productor'] });
      toast.success('✅ Estado del pedido actualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el estado');
    },
  });

  // Mutation para actualizar estado de pago
  const actualizarEstadoPagoMutation = useMutation({
    mutationFn: async ({ id, estadoPago }: { id: number; estadoPago: 'pendiente' | 'pagado' | 'reembolsado' }) => {
      return await pedidosService.actualizarEstadoPago(id, estadoPago);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'productor'] });
      toast.success('✅ Estado de pago actualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el estado de pago');
    },
  });

  const handleCambiarEstadoPago = (id: number, nuevoEstadoPago: 'pendiente' | 'pagado' | 'reembolsado') => {
    actualizarEstadoPagoMutation.mutate({ id, estadoPago: nuevoEstadoPago });
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; icon: JSX.Element; label: string }> = {
      pendiente: { 
        class: 'bg-warning text-dark', 
        icon: <BiTime />, 
        label: 'Pendiente' 
      },
      confirmado: { 
        class: 'bg-info', 
        icon: <BiCheckCircle />, 
        label: 'Confirmado' 
      },
      en_preparacion: { 
        class: 'bg-primary', 
        icon: <BiPackage />, 
        label: 'En Preparación' 
      },
      en_camino: { 
        class: 'bg-primary', 
        icon: <BiPackage />, 
        label: 'En Camino' 
      },
      entregado: { 
        class: 'bg-success', 
        icon: <BiCheckCircle />, 
        label: 'Entregado' 
      },
      cancelado: { 
        class: 'bg-danger', 
        icon: <BiXCircle />, 
        label: 'Cancelado' 
      },
    };
    return badges[estado] || badges.pendiente;
  };

  const handleCambiarEstado = (id: number, nuevoEstado: string) => {
    actualizarEstadoMutation.mutate({ id, estado: nuevoEstado });
  };

  const getSiguienteEstado = (estadoActual: string): string | null => {
    const estados: Record<string, string> = {
      'pendiente': 'confirmado',
      'confirmado': 'en_preparacion',
      'en_preparacion': 'en_camino',
      'en_camino': 'entregado',
    };
    return estados[estadoActual] || null;
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando pedidos...</span>
        </div>
      </div>
    );
  }

  // Ordenar pedidos: más recientes primero
  const pedidosList = React.useMemo(() => {
    const lista = (pedidos || []) as Pedido[];
    return [...lista].sort((a, b) => {
      const fechaA = a.fecha_pedido ? new Date(a.fecha_pedido).getTime() : 0;
      const fechaB = b.fecha_pedido ? new Date(b.fecha_pedido).getTime() : 0;
      return fechaB - fechaA; // Orden descendente (más recientes primero)
    });
  }, [pedidos]);

  // Filtrar pedidos
  const pedidosFiltrados = pedidosList.filter(pedido => {
    const coincideEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
    const coincideBusqueda = !busqueda || 
      pedido.id_pedido.toString().includes(busqueda) ||
      (pedido.direccion_entrega && pedido.direccion_entrega.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideEstado && coincideBusqueda;
  });

  // Estadísticas
  const pedidosPendientes = pedidosList.filter(p => p.estado === 'pendiente').length;
  const pedidosConfirmados = pedidosList.filter(p => p.estado === 'confirmado').length;
  const pedidosEnPreparacion = pedidosList.filter(p => p.estado === 'en_preparacion').length;
  const pedidosEntregados = pedidosList.filter(p => p.estado === 'entregado').length;
  const totalVentas = pedidosList
    .filter(p => p.estado === 'entregado')
    .reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            className="btn btn-outline-secondary mb-2"
            onClick={() => navigate('/productor/dashboard')}
          >
            <BiArrowBack className="me-1" />
            Volver al Dashboard
          </button>
          <h2 className="fw-bold">
            <BiReceipt className="me-2" />
            Mis Pedidos
          </h2>
          <p className="text-muted mb-0">Gestiona los pedidos que has recibido</p>
        </div>
      </div>

      {/* Estadísticas */}
      {pedidosList.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted mb-1">Total</h6>
                <h4 className="fw-bold mb-0">{pedidosList.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted mb-1">Pendientes</h6>
                <h4 className="fw-bold text-warning mb-0">{pedidosPendientes}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted mb-1">Confirmados</h6>
                <h4 className="fw-bold text-info mb-0">{pedidosConfirmados}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted mb-1">En Preparación</h6>
                <h4 className="fw-bold text-primary mb-0">{pedidosEnPreparacion}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted mb-1">Entregados</h6>
                <h4 className="fw-bold text-success mb-0">{pedidosEntregados}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted mb-1">Total Ventas</h6>
                <h4 className="fw-bold text-success mb-0">${totalVentas.toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {pedidosList.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <BiSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por ID o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${filtroEstado === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos ({pedidosList.length})
              </button>
              <button
                type="button"
                className={`btn ${filtroEstado === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFiltroEstado('pendiente')}
              >
                Pendientes ({pedidosPendientes})
              </button>
              <button
                type="button"
                className={`btn ${filtroEstado === 'confirmado' ? 'btn-info' : 'btn-outline-info'}`}
                onClick={() => setFiltroEstado('confirmado')}
              >
                Confirmados ({pedidosConfirmados})
              </button>
              <button
                type="button"
                className={`btn ${filtroEstado === 'entregado' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setFiltroEstado('entregado')}
              >
                Entregados ({pedidosEntregados})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      {pedidosList.length === 0 ? (
        <div className="text-center py-5">
          <BiReceipt className="display-1 text-muted mb-3" />
          <h3 className="text-muted">No tienes pedidos aún</h3>
          <p className="text-muted">Los pedidos que recibas aparecerán aquí</p>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-center py-5">
          <BiSearch className="display-1 text-muted mb-3" />
          <h3 className="text-muted">No se encontraron pedidos</h3>
          <p className="text-muted">Intenta con otros filtros</p>
        </div>
      ) : (
        <div className="row g-4">
          {pedidosFiltrados.map((pedido) => {
            const estadoInfo = getEstadoBadge(pedido.estado);
            const siguienteEstado = getSiguienteEstado(pedido.estado);

            return (
              <div key={pedido.id_pedido} className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">
                        <BiReceipt className="me-2" />
                        Pedido #{pedido.id_pedido}
                      </h5>
                      <small className="text-muted">
                        {new Date(pedido.fecha_pedido || Date.now()).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </div>
                    <span className={`badge ${estadoInfo.class} d-flex align-items-center gap-1`}>
                      {estadoInfo.icon}
                      {estadoInfo.label}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {/* Información del Cliente */}
                      {(pedido.consumidor_nombre || pedido.consumidor_email || pedido.consumidor_telefono) && (
                        <div className="col-md-4">
                          <h6 className="text-muted mb-3 d-flex align-items-center">
                            <BiUser className="me-2" />
                            Cliente
                          </h6>
                          {pedido.consumidor_nombre && (
                            <div className="mb-2">
                              <strong className="d-block text-muted small">Nombre</strong>
                              <span>{pedido.consumidor_nombre}</span>
                            </div>
                          )}
                          {pedido.consumidor_email && (
                            <div className="mb-2">
                              <strong className="d-block text-muted small">
                                <BiEnvelope className="me-1" />
                                Email
                              </strong>
                              <span className="small">{pedido.consumidor_email}</span>
                            </div>
                          )}
                          {pedido.consumidor_telefono && (
                            <div className="mb-2">
                              <strong className="d-block text-muted small">
                                <BiPhone className="me-1" />
                                Teléfono
                              </strong>
                              <span className="small">{pedido.consumidor_telefono}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Información del Pedido */}
                      <div className={pedido.consumidor_nombre || pedido.consumidor_email || pedido.consumidor_telefono ? "col-md-4" : "col-md-6"}>
                        <h6 className="text-muted mb-3 d-flex align-items-center">
                          <BiReceipt className="me-2" />
                          Detalles del Pedido
                        </h6>
                        <div className="mb-2">
                          <strong className="d-block text-muted small">
                            <BiDollar className="me-1" />
                            Total
                          </strong>
                          <span className="fs-5 fw-bold text-success">
                            ${pedido.total?.toLocaleString()}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong className="d-block text-muted small">
                            <BiCreditCard className="me-1" />
                            Método de pago
                          </strong>
                          <span className="badge bg-info">
                            {pedido.metodo_pago ? pedido.metodo_pago.charAt(0).toUpperCase() + pedido.metodo_pago.slice(1) : 'No especificado'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong className="d-block text-muted small mb-1">Estado de pago</strong>
                          <select
                            className={`form-select form-select-sm d-inline-block w-auto ${
                              pedido.estado_pago === 'pagado' ? 'border-success' : 
                              pedido.estado_pago === 'reembolsado' ? 'border-danger' : 
                              'border-warning'
                            }`}
                            value={pedido.estado_pago || 'pendiente'}
                            onChange={(e) => handleCambiarEstadoPago(pedido.id_pedido, e.target.value as 'pendiente' | 'pagado' | 'reembolsado')}
                            disabled={actualizarEstadoPagoMutation.isPending}
                            style={{ 
                              maxWidth: '150px',
                              fontWeight: '500'
                            }}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="pagado">Pagado</option>
                            <option value="reembolsado">Reembolsado</option>
                          </select>
                        </div>
                      </div>

                      {/* Información de Entrega */}
                      <div className={pedido.consumidor_nombre || pedido.consumidor_email || pedido.consumidor_telefono ? "col-md-4" : "col-md-6"}>
                        <h6 className="text-muted mb-3 d-flex align-items-center">
                          <BiMapPin className="me-2" />
                          Entrega
                        </h6>
                        {pedido.direccion_entrega && (
                          <div className="mb-2">
                            <strong className="d-block text-muted small">Dirección</strong>
                            <span className="small">{pedido.direccion_entrega}</span>
                          </div>
                        )}
                        {(pedido.ciudad_nombre || pedido.departamento_nombre) && (
                          <div className="mb-2">
                            <strong className="d-block text-muted small">Ubicación</strong>
                            <span className="small">
                              {pedido.ciudad_nombre}
                              {pedido.ciudad_nombre && pedido.departamento_nombre && ', '}
                              {pedido.departamento_nombre}
                            </span>
                          </div>
                        )}
                        {pedido.notas && (
                          <div className="mb-2">
                            <strong className="d-block text-muted small">Notas</strong>
                            <span className="small text-muted">{pedido.notas}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detalles de Productos */}
                    {pedido.detalles && pedido.detalles.length > 0 && (
                      <div className="mt-4 pt-3 border-top">
                        <h6 className="text-muted mb-3">
                          <BiPackage className="me-2" />
                          Productos del Pedido
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pedido.detalles.map((detalle: any) => (
                                <tr key={detalle.id_detalle}>
                                  <td>
                                    {detalle.producto_nombre || `Producto #${detalle.id_producto}`}
                                    {detalle.unidad_medida && (
                                      <small className="text-muted ms-1">({detalle.unidad_medida})</small>
                                    )}
                                  </td>
                                  <td>{detalle.cantidad}</td>
                                  <td>${detalle.precio_unitario?.toLocaleString()}</td>
                                  <td className="fw-bold">${detalle.subtotal?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={3} className="text-end fw-bold">Total:</td>
                                <td className="fw-bold text-success">${pedido.total?.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="mt-4 pt-3 border-top">
                      <h6 className="text-muted mb-3">Acciones</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {pedido.estado === 'pendiente' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleCambiarEstado(pedido.id_pedido, 'confirmado')}
                              disabled={actualizarEstadoMutation.isPending}
                            >
                              <BiCheckCircle className="me-1" />
                              Confirmar Pedido
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleCambiarEstado(pedido.id_pedido, 'cancelado')}
                              disabled={actualizarEstadoMutation.isPending}
                            >
                              <BiXCircle className="me-1" />
                              Cancelar
                            </button>
                          </>
                        )}
                        {pedido.estado === 'confirmado' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleCambiarEstado(pedido.id_pedido, 'en_preparacion')}
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            <BiPackage className="me-1" />
                            En Preparación
                          </button>
                        )}
                        {pedido.estado === 'en_preparacion' && (
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleCambiarEstado(pedido.id_pedido, 'en_camino')}
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            <BiPackage className="me-1" />
                            Enviar (En Camino)
                          </button>
                        )}
                        {pedido.estado === 'en_camino' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleCambiarEstado(pedido.id_pedido, 'entregado')}
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            <BiCheckCircle className="me-1" />
                            Marcar como Entregado
                          </button>
                        )}
                        {siguienteEstado && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleCambiarEstado(pedido.id_pedido, siguienteEstado)}
                            disabled={actualizarEstadoMutation.isPending}
                          >
                            Avanzar Estado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductorPedidosPage;

