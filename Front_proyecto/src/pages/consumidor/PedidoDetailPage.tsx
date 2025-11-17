import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosService, imagenesService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  BiArrowBack, 
  BiReceipt, 
  BiPackage, 
  BiCheckCircle, 
  BiXCircle, 
  BiTime,
  BiEdit,
  BiTrash,
  BiMapPin,
  BiDollar,
  BiUser,
  BiEnvelope,
  BiPhone,
  BiSave,
  BiX
} from 'react-icons/bi';
import type { Pedido, DetallePedido } from '../../services/pedidos';
import ConfirmModal from '../../components/ConfirmModal';

const PedidoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    direccion_entrega: '',
    notas: '',
    metodo_pago: 'efectivo' as Pedido['metodo_pago'],
  });

  // Query para obtener el pedido
  const { data: pedidoResponse, isLoading } = useQuery({
    queryKey: ['pedido', id],
    queryFn: async () => {
      if (!id) throw new Error('ID no válido');
      const response = await pedidosService.obtenerPedido(parseInt(id));
      if (!response.success) {
        throw new Error(response.message || 'Error al obtener el pedido');
      }
      return response.data;
    },
    enabled: !!id,
  });

  const pedido = pedidoResponse as (Pedido & { detalles: DetallePedido[] }) | undefined;

  // Inicializar datos de edición cuando se carga el pedido
  React.useEffect(() => {
    if (pedido && !isEditing) {
      setEditData({
        direccion_entrega: pedido.direccion_entrega || '',
        notas: pedido.notas || '',
        metodo_pago: pedido.metodo_pago || 'efectivo',
      });
    }
  }, [pedido, isEditing]);

  // Mutation para actualizar pedido
  const updatePedidoMutation = useMutation({
    mutationFn: async (data: Partial<Pedido>) => {
      if (!id) throw new Error('ID no válido');
      // Solo enviar los campos editables
      const datosActualizar: Partial<Pedido> = {};
      if (data.direccion_entrega !== undefined) {
        datosActualizar.direccion_entrega = data.direccion_entrega;
      }
      if (data.notas !== undefined) {
        datosActualizar.notas = data.notas;
      }
      if (data.metodo_pago !== undefined) {
        datosActualizar.metodo_pago = data.metodo_pago;
      }
      
      const response = await pedidosService.actualizarPedido(parseInt(id), datosActualizar);
      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar el pedido');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Pedido actualizado correctamente');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['pedido', id] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'consumidor'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el pedido');
    },
  });

  // Mutation para eliminar pedido
  const deletePedidoMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID no válido');
      const response = await pedidosService.eliminarPedido(parseInt(id));
      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar el pedido');
      }
      return response;
    },
    onSuccess: () => {
      toast.success('✅ Pedido eliminado correctamente');
      navigate('/consumidor/pedidos');
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'consumidor'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el pedido');
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (pedido) {
      setEditData({
        direccion_entrega: pedido.direccion_entrega || '',
        notas: pedido.notas || '',
        metodo_pago: pedido.metodo_pago || 'efectivo',
      });
    }
  };

  const handleSave = () => {
    updatePedidoMutation.mutate(editData);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deletePedidoMutation.mutate();
    setShowDeleteModal(false);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; icon: JSX.Element; text: string }> = {
      pendiente: { class: 'bg-warning', icon: <BiTime />, text: 'PENDIENTE' },
      confirmado: { class: 'bg-info', icon: <BiCheckCircle />, text: 'CONFIRMADO' },
      en_preparacion: { class: 'bg-primary', icon: <BiPackage />, text: 'EN PREPARACIÓN' },
      en_camino: { class: 'bg-primary', icon: <BiPackage />, text: 'EN CAMINO' },
      entregado: { class: 'bg-success', icon: <BiCheckCircle />, text: 'ENTREGADO' },
      cancelado: { class: 'bg-danger', icon: <BiXCircle />, text: 'CANCELADO' },
    };
    return badges[estado] || badges.pendiente;
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando pedido...</span>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <h4>Pedido no encontrado</h4>
          <p>El pedido que buscas no existe o no tienes permisos para verlo.</p>
          <Link to="/consumidor/pedidos" className="btn btn-primary">
            <BiArrowBack className="me-2" />
            Volver a Mis Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(pedido.estado);
  const puedeEditar = pedido.estado === 'pendiente' || pedido.estado === 'confirmado';
  const puedeEliminar = pedido.estado === 'pendiente';

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/consumidor/pedidos" className="btn btn-outline-secondary mb-2">
            <BiArrowBack className="me-2" />
            Volver a Mis Pedidos
          </Link>
          <h2 className="fw-bold mb-0">
            <BiReceipt className="me-2" />
            Pedido #{pedido.id_pedido}
          </h2>
        </div>
        <div className="d-flex gap-2">
          {puedeEditar && !isEditing && (
            <button className="btn btn-primary" onClick={handleEdit}>
              <BiEdit className="me-2" />
              Editar
            </button>
          )}
          {puedeEliminar && !isEditing && (
            <button 
              className="btn btn-danger" 
              onClick={handleDelete}
              disabled={deletePedidoMutation.isPending}
            >
              {deletePedidoMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <BiTrash className="me-2" />
                  Eliminar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Estado del pedido */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Estado del Pedido</h5>
          <span className={`badge ${estadoBadge.class} fs-6`}>
            {estadoBadge.icon}
            {' '}
            {estadoBadge.text}
          </span>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Fecha del Pedido:</strong>{' '}
                {pedido.fecha_pedido 
                  ? format(new Date(pedido.fecha_pedido), 'dd MMMM yyyy, HH:mm')
                  : 'No disponible'}
              </p>
              {pedido.fecha_entrega && (
                <p className="mb-2">
                  <strong>Fecha de Entrega:</strong>{' '}
                  {format(new Date(pedido.fecha_entrega), 'dd MMMM yyyy')}
                </p>
              )}
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Estado de Pago:</strong>{' '}
                <span className={`badge ${pedido.estado_pago === 'pagado' ? 'bg-success' : pedido.estado_pago === 'reembolsado' ? 'bg-danger' : 'bg-warning'}`}>
                  {pedido.estado_pago?.toUpperCase() || 'PENDIENTE'}
                </span>
              </p>
              <p className="mb-0">
                <strong>Método de Pago:</strong>{' '}
                <span className="text-capitalize">{pedido.metodo_pago}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información del pedido */}
      <div className="row g-4 mb-4">
        {/* Información de entrega */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <BiMapPin className="me-2" />
                Información de Entrega
              </h5>
            </div>
            <div className="card-body">
              {isEditing ? (
                <div>
                  <div className="mb-3">
                    <label className="form-label">Dirección de Entrega *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.direccion_entrega}
                      onChange={(e) => setEditData({ ...editData, direccion_entrega: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Método de Pago *</label>
                    <select
                      className="form-select"
                      value={editData.metodo_pago}
                      onChange={(e) => setEditData({ ...editData, metodo_pago: e.target.value as Pedido['metodo_pago'] })}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="nequi">Nequi</option>
                      <option value="daviplata">Daviplata</option>
                      <option value="pse">PSE</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notas</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editData.notas}
                      onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
                      placeholder="Instrucciones especiales para la entrega..."
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={updatePedidoMutation.isPending || !editData.direccion_entrega.trim()}
                    >
                      {updatePedidoMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <BiSave className="me-2" />
                          Guardar
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={updatePedidoMutation.isPending}
                    >
                      <BiX className="me-2" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-2">
                    <strong>Dirección:</strong>
                  </p>
                  <p className="text-muted mb-3">{pedido.direccion_entrega}</p>
                  {pedido.ciudad_nombre && (
                    <p className="mb-2">
                      <strong>Ciudad:</strong> {pedido.ciudad_nombre}
                      {pedido.departamento_nombre && `, ${pedido.departamento_nombre}`}
                    </p>
                  )}
                  {pedido.notas && (
                    <div className="mt-3">
                      <strong>Notas:</strong>
                      <p className="text-muted mb-0">{pedido.notas}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del productor */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <BiUser className="me-2" />
                Información del Productor
              </h5>
            </div>
            <div className="card-body">
              {pedido.productor_nombre && (
                <p className="mb-2">
                  <strong>Nombre:</strong> {pedido.productor_nombre}
                </p>
              )}
              {pedido.productor_email && (
                <p className="mb-2">
                  <BiEnvelope className="me-2" />
                  {pedido.productor_email}
                </p>
              )}
              {pedido.productor_telefono && (
                <p className="mb-0">
                  <BiPhone className="me-2" />
                  {pedido.productor_telefono}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detalles del pedido - Productos */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            <BiPackage className="me-2" />
            Productos del Pedido
          </h5>
        </div>
        <div className="card-body">
          {pedido.detalles && pedido.detalles.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalles.map((detalle) => {
                    const imagenProducto = detalle.producto_imagen
                      ? imagenesService.construirUrlImagen(detalle.producto_imagen)
                      : null;

                    return (
                      <tr key={detalle.id_detalle}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(0,0,0,0.05)'
                              }}
                            >
                              {imagenProducto ? (
                                <img
                                  src={imagenProducto}
                                  alt={detalle.producto_nombre || 'Producto'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="text-muted">
                                  <BiPackage className="fs-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <strong>{detalle.producto_nombre || `Producto #${detalle.id_producto}`}</strong>
                              {detalle.unidad_medida && (
                                <small className="text-muted d-block">{detalle.unidad_medida}</small>
                              )}
                              {detalle.producto_descripcion && (
                                <small className="text-muted d-block">{detalle.producto_descripcion}</small>
                              )}
                            </div>
                          </div>
                        </td>
                      <td>{detalle.cantidad}</td>
                      <td>${detalle.precio_unitario.toLocaleString()}</td>
                      <td className="text-end">
                        <strong>${detalle.subtotal.toLocaleString()}</strong>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-end">
                      <strong>Total:</strong>
                    </td>
                    <td className="text-end">
                      <h5 className="mb-0 text-primary">
                        <BiDollar className="me-1" />
                        ${pedido.total.toLocaleString()}
                      </h5>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-muted">No hay productos en este pedido.</p>
          )}
        </div>
      </div>

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Pedido"
        message="¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deletePedidoMutation.isPending}
      />
    </div>
  );
};

export default PedidoDetailPage;

