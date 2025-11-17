import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { pedidosService, carritoService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { BiReceipt, BiPackage, BiCheckCircle, BiXCircle, BiTime, BiPlus, BiCart } from 'react-icons/bi';
import type { Pedido } from '../../types';

const PedidosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos', 'consumidor'],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('consumidor', user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  // Query para verificar si hay items en el carrito
  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => {
      const response = await carritoService.obtenerCarrito();
      return response.data || null;
    },
  });

  const handleNuevoPedido = () => {
    // Si hay items en el carrito, ir al carrito para completar el pedido
    if (carrito?.items && carrito.items.length > 0) {
      navigate('/consumidor/carrito');
    } else {
      // Si el carrito está vacío, ir a productos para agregar items
      navigate('/productos');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; icon: JSX.Element }> = {
      pendiente: { class: 'bg-warning', icon: <BiTime /> },
      confirmado: { class: 'bg-info', icon: <BiCheckCircle /> },
      en_preparacion: { class: 'bg-primary', icon: <BiPackage /> },
      en_camino: { class: 'bg-primary', icon: <BiPackage /> },
      entregado: { class: 'bg-success', icon: <BiCheckCircle /> },
      cancelado: { class: 'bg-danger', icon: <BiXCircle /> },
    };
    return badges[estado] || badges.pendiente;
  };

  // Ordenar pedidos: más recientes primero (debe estar antes de cualquier return)
  const pedidosList = React.useMemo(() => {
    const lista = (pedidos || []) as Pedido[];
    return [...lista].sort((a, b) => {
      const fechaA = a.fecha_pedido ? new Date(a.fecha_pedido).getTime() : 0;
      const fechaB = b.fecha_pedido ? new Date(b.fecha_pedido).getTime() : 0;
      return fechaB - fechaA; // Orden descendente (más recientes primero)
    });
  }, [pedidos]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando pedidos...</span>
        </div>
      </div>
    );
  }

  if (pedidosList.length === 0) {
    return (
      <div className="text-center py-5">
        <BiReceipt className="display-1 text-muted mb-3" />
        <h3 className="text-muted">No tienes pedidos aún</h3>
        <p className="text-muted mb-4">Realiza tu primer pedido para comenzar</p>
        <Link to="/productos" className="btn btn-primary btn-lg">
          <BiPackage className="me-2" />
          Ver Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          <BiReceipt className="me-2" />
          Mis Pedidos
        </h2>
        <button 
          onClick={handleNuevoPedido}
          className="btn btn-primary"
        >
          {carrito?.items && carrito.items.length > 0 ? (
            <>
              <BiCart className="me-2" />
              Completar Pedido ({carrito.items.length})
            </>
          ) : (
            <>
              <BiPlus className="me-2" />
              Nuevo Pedido
            </>
          )}
        </button>
      </div>

      <div className="row g-4">
        {pedidosList.map((pedido) => {
          const estadoBadge = getEstadoBadge(pedido.estado);
          return (
            <div key={pedido.id_pedido} className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Pedido #{pedido.id_pedido}</h5>
                    <small className="text-muted">
                      {pedido.fecha_pedido && format(new Date(pedido.fecha_pedido), 'dd MMMM yyyy, HH:mm')}
                    </small>
                  </div>
                  <span className={`badge ${estadoBadge.class} fs-6`}>
                    {estadoBadge.icon}
                    {' '}
                    {pedido.estado.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Total:</strong>{' '}
                        <span className="h5 text-primary mb-0">
                          ${pedido.total.toLocaleString()}
                        </span>
                      </p>
                      <p className="mb-2">
                        <strong>Método de Pago:</strong>{' '}
                        <span className="text-capitalize">{pedido.metodo_pago}</span>
                      </p>
                      <p className="mb-2">
                        <strong>Estado de Pago:</strong>{' '}
                        <span className={`badge ${pedido.estado_pago === 'pagado' ? 'bg-success' : 'bg-warning'}`}>
                          {pedido.estado_pago?.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Dirección de Entrega:</strong>
                      </p>
                      <p className="text-muted mb-2">{pedido.direccion_entrega}</p>
                      {pedido.fecha_entrega && (
                        <p className="mb-0">
                          <strong>Fecha de Entrega:</strong>{' '}
                          {format(new Date(pedido.fecha_entrega), 'dd MMMM yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  {pedido.notas && (
                    <div className="mt-3">
                      <strong>Notas:</strong>
                      <p className="text-muted mb-0">{pedido.notas}</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <Link
                      to={`/consumidor/pedidos/${pedido.id_pedido}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PedidosPage;

