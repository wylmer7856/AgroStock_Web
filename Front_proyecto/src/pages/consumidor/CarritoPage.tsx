import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { carritoService } from '../../services';
import { carritoLocalService } from '../../services/carritoLocal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiCart, BiTrash, BiPlus, BiMinus, BiRightArrowAlt, BiPackage, BiLogIn } from 'react-icons/bi';
import { useForm } from 'react-hook-form';
import ConfirmModal from '../../components/ConfirmModal';

interface CheckoutFormData {
  direccionEntrega: string;
  id_ciudad_entrega?: number;
  notas?: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'pse' | 'tarjeta';
}

const CarritoPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; id?: number }>({ show: false });
  const [carritoLocal, setCarritoLocal] = useState(carritoLocalService.obtenerCarrito());

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      metodo_pago: 'efectivo',
    },
  });

  // Sincronizar carrito local cuando el usuario inicia sesión
  useEffect(() => {
    if (isAuthenticated && user && carritoLocal.items.length > 0) {
      carritoLocalService.sincronizarConServidor(carritoService).then(() => {
        setCarritoLocal(carritoLocalService.obtenerCarrito());
        queryClient.invalidateQueries({ queryKey: ['carrito'] });
        toast.info('Carrito sincronizado con tu cuenta');
      });
    }
  }, [isAuthenticated, user]);

  // Query para carrito (solo si está autenticado)
  const { data: carrito, isLoading } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => {
      const response = await carritoService.obtenerCarrito();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Usar carrito local si no está autenticado, o carrito del servidor si está autenticado
  const carritoActual = isAuthenticated ? carrito : {
    items: carritoLocal.items.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      precio_total: item.precio_total,
      disponible: item.disponible,
      stock_actual: item.stock_actual,
      producto_nombre: item.producto_nombre,
      imagen_principal: item.imagen_principal,
    })),
  };

  // Mutation para actualizar cantidad
  const updateCantidadMutation = useMutation({
    mutationFn: async ({ id, cantidad }: { id: number; cantidad: number }) => {
      if (isAuthenticated) {
        return await carritoService.actualizarItem(id, cantidad);
      } else {
        carritoLocalService.actualizarCantidad(id, cantidad);
        setCarritoLocal(carritoLocalService.obtenerCarrito());
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['carrito'] });
      }
      // No mostrar toast para actualizaciones de cantidad - el usuario ya ve el cambio en el input
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar carrito');
    },
  });

  // Mutation para eliminar item
  const eliminarItemMutation = useMutation({
    mutationFn: async (id: number) => {
      if (isAuthenticated) {
        return await carritoService.eliminarItem(id);
      } else {
        carritoLocalService.eliminarItem(id);
        setCarritoLocal(carritoLocalService.obtenerCarrito());
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['carrito'] });
      }
      toast.success('Producto eliminado del carrito');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar producto');
    },
  });

  // Mutation para checkout
  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      return await carritoService.checkout(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['carrito', 'pedidos'] });
      toast.success('¡Pedido realizado exitosamente!');
      navigate('/consumidor/pedidos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al procesar el pedido');
    },
  });

  const handleUpdateCantidad = (id: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    updateCantidadMutation.mutate({ id, cantidad: nuevaCantidad });
  };

  const handleEliminar = (id: number) => {
    setShowDeleteModal({ show: true, id });
  };

  const confirmEliminar = () => {
    if (showDeleteModal.id !== undefined) {
      eliminarItemMutation.mutate(showDeleteModal.id);
      setShowDeleteModal({ show: false });
    }
  };

  const onSubmitCheckout = (data: CheckoutFormData) => {
    checkoutMutation.mutate(data);
  };

  if (isLoading && isAuthenticated) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando carrito...</span>
        </div>
      </div>
    );
  }

  const items = carritoActual?.items || [];
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-5">
        <BiCart className="display-1 text-muted mb-3" />
        <h3 className="text-muted">Tu carrito está vacío</h3>
        <p className="text-muted mb-4">Agrega productos para comenzar a comprar</p>
        <Link to="/productos" className="btn btn-primary btn-lg">
          <BiPackage className="me-2" />
          Ver Productos
        </Link>
      </div>
    );
  }

  const total = items.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <BiCart className="me-2" />
          Mi Carrito
        </h2>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary fs-6">
            {items.length} producto{items.length !== 1 ? 's' : ''}
          </span>
          {!isAuthenticated && (
            <Link to="/login" className="btn btn-sm btn-outline-primary">
              <BiLogIn className="me-1" />
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="alert alert-info mb-4">
          <strong>Nota:</strong> Estás usando un carrito temporal. 
          <Link to="/login" className="alert-link ms-1">Inicia sesión</Link> para guardar tu carrito y proceder al pago.
        </div>
      )}

      <div className="row g-4">
        {/* Lista de Productos */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {items.map((item: any) => (
                <div key={item.id_producto} className="border-bottom pb-4 mb-4 last-child-border-0">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      {item.imagen_principal ? (
                        <img
                          src={item.imagen_principal}
                          className="img-fluid rounded"
                          alt={item.producto_nombre}
                          style={{ height: '100px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
                          <BiPackage className="fs-1 text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <h5 className="mb-1">{item.producto_nombre}</h5>
                      <p className="text-muted small mb-0">
                        ${item.precio_unitario?.toLocaleString()} / unidad
                      </p>
                    </div>
                    <div className="col-md-3">
                      <div className="input-group">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleUpdateCantidad(item.id_producto, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <BiMinus />
                        </button>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={item.cantidad}
                          readOnly
                          style={{ maxWidth: '80px' }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleUpdateCantidad(item.id_producto, item.cantidad + 1)}
                          disabled={!item.disponible || item.cantidad >= item.stock_actual}
                        >
                          <BiPlus />
                        </button>
                      </div>
                      {!item.disponible && (
                        <small className="text-danger d-block mt-1">No disponible</small>
                      )}
                    </div>
                    <div className="col-md-2 text-end">
                      <div className="fw-bold text-primary mb-2">
                        ${item.precio_total?.toLocaleString()}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleEliminar(item.id_producto)}
                      >
                        <BiTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen y Checkout */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '80px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Resumen del Pedido</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal:</span>
                <span className="fw-bold">${total.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Envío:</span>
                <span className="text-muted">A calcular</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="h5 mb-0">Total:</span>
                <span className="h5 fw-bold text-primary mb-0">${total.toLocaleString()}</span>
              </div>

              {!isAuthenticated ? (
                <div>
                  <p className="text-muted small mb-3">
                    Inicia sesión para proceder al pago
                  </p>
                  <Link to="/login" className="btn btn-primary w-100 btn-lg">
                    <BiLogIn className="me-2" />
                    Iniciar Sesión para Pagar
                  </Link>
                </div>
              ) : !showCheckout ? (
                <button
                  className="btn btn-primary w-100 btn-lg"
                  onClick={() => setShowCheckout(true)}
                >
                  Proceder al Checkout
                  <BiRightArrowAlt className="ms-2" />
                </button>
              ) : (
                <form onSubmit={handleSubmit(onSubmitCheckout)}>
                  <div className="mb-3">
                    <label className="form-label">Dirección de Entrega *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.direccionEntrega ? 'is-invalid' : ''}`}
                      {...register('direccionEntrega', { required: 'La dirección es requerida' })}
                      placeholder="Calle 123 #45-67"
                    />
                    {errors.direccionEntrega && (
                      <div className="invalid-feedback">{errors.direccionEntrega.message}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Método de Pago *</label>
                    <select
                      className={`form-select ${errors.metodo_pago ? 'is-invalid' : ''}`}
                      {...register('metodo_pago', { required: 'Selecciona un método de pago' })}
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
                    <label className="form-label">Notas (opcional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      {...register('notas')}
                      placeholder="Instrucciones especiales para la entrega..."
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-fill"
                      onClick={() => setShowCheckout(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill"
                      disabled={checkoutMutation.isPending}
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          Confirmar Pedido
                          <BiRightArrowAlt className="ms-2" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={showDeleteModal.show}
        onClose={() => setShowDeleteModal({ show: false })}
        onConfirm={confirmEliminar}
        title="Eliminar Producto"
        message="¿Eliminar este producto del carrito?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarItemMutation.isPending}
      />
    </div>
  );
};

export default CarritoPage;
