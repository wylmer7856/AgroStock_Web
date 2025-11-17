import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listaDeseosService } from '../../services';
import { listaDeseosLocalService } from '../../services/listaDeseosLocal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiHeart, BiTrash, BiCart, BiPackage, BiLogIn } from 'react-icons/bi';
import type { ListaDeseo } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';
import imagenesService from '../../services/imagenes';

const ListaDeseosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [listaLocal, setListaLocal] = useState(listaDeseosLocalService.obtenerListaDeseos());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Sincronizar lista local cuando el usuario inicia sesión
  useEffect(() => {
    if (isAuthenticated && user && listaLocal.length > 0) {
      listaDeseosLocalService.sincronizarConServidor(listaDeseosService).then(() => {
        setListaLocal(listaDeseosLocalService.obtenerListaDeseos());
        queryClient.invalidateQueries({ queryKey: ['lista-deseos'] });
        toast.info('Lista de deseos sincronizada con tu cuenta');
      });
    }
  }, [isAuthenticated, user]);

  // Query para lista de deseos (solo si está autenticado)
  const { data: listaDeseos, isLoading } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      const response = await listaDeseosService.obtenerMiListaDeseos();
      return response.data || [];
    },
    enabled: isAuthenticated,
  });

  // Usar lista local si no está autenticado, o lista del servidor si está autenticado
  const listaActual = isAuthenticated ? (listaDeseos || []) : listaLocal;

  // Mutation para eliminar
  const eliminarMutation = useMutation({
    mutationFn: async ({ id_lista, id_producto }: { id_lista?: number; id_producto: number }) => {
      if (isAuthenticated && id_lista) {
        return await listaDeseosService.eliminarDeListaDeseos(id_lista);
      } else {
        listaDeseosLocalService.eliminarDeListaDeseos(id_producto);
        setListaLocal(listaDeseosLocalService.obtenerListaDeseos());
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['lista-deseos'] });
      }
      toast.success('Eliminado de la lista de deseos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar');
    },
  });

  // Mutation para limpiar toda la lista
  const limpiarMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return await listaDeseosService.limpiarListaDeseos();
      } else {
        listaDeseosLocalService.limpiarListaDeseos();
        setListaLocal(listaDeseosLocalService.obtenerListaDeseos());
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['lista-deseos'] });
      }
      toast.success('Lista de deseos limpiada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al limpiar lista');
    },
  });

  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; id_lista?: number; id_producto?: number }>({ show: false });
  const [showClearModal, setShowClearModal] = useState(false);

  const handleEliminar = (id_lista: number | undefined, id_producto: number) => {
    setShowDeleteModal({ show: true, id_lista, id_producto });
  };

  const confirmEliminar = () => {
    if (showDeleteModal.id_lista !== undefined && showDeleteModal.id_producto !== undefined) {
      eliminarMutation.mutate({ id_lista: showDeleteModal.id_lista, id_producto: showDeleteModal.id_producto });
      setShowDeleteModal({ show: false });
    }
  };

  const handleLimpiar = () => {
    setShowClearModal(true);
  };

  const confirmLimpiar = () => {
    limpiarMutation.mutate();
    setShowClearModal(false);
  };

  if (isLoading && isAuthenticated) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (listaActual.length === 0) {
    return (
      <div className="text-center py-5">
        <div 
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: '120px',
            height: '120px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <BiHeart 
            style={{
              fontSize: '4rem',
              color: '#dc3545',
              fill: 'none',
              stroke: '#dc3545',
              strokeWidth: '2',
            }}
          />
        </div>
        <h3 className="text-muted">Tu lista de deseos está vacía</h3>
        <p className="text-muted mb-4">Agrega productos que te gusten a tu lista de deseos</p>
        <Link to="/productos" className="btn btn-primary btn-lg">
          <BiPackage className="me-2" />
          Explorar Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <BiHeart className="me-2 text-danger" />
          Mi Lista de Deseos
        </h2>
        <div className="d-flex gap-2 align-items-center">
          <span className="badge bg-primary fs-6">
            {listaActual.length} producto{listaActual.length !== 1 ? 's' : ''}
          </span>
          {!isAuthenticated && (
            <Link to="/login" className="btn btn-sm btn-outline-primary">
              <BiLogIn className="me-1" />
              Iniciar Sesión
            </Link>
          )}
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleLimpiar}
            disabled={limpiarMutation.isPending}
          >
            <BiTrash className="me-1" />
            Limpiar Todo
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="alert alert-info mb-4">
          <strong>Nota:</strong> Estás usando una lista de deseos temporal. 
          <Link to="/login" className="alert-link ms-1">Inicia sesión</Link> para guardar tu lista permanentemente.
        </div>
      )}

      <div className="row g-4">
        {listaActual.map((item: any, index: number) => (
          <div key={item.id_lista || `local-${item.id_producto}-${index}`} className="col-md-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <Link to={`/productos/${item.id_producto}`} className="text-decoration-none">
                {(() => {
                  const imagenUrl = item.imagen_principal 
                    ? (item.imagen_principal.startsWith('http') 
                        ? item.imagen_principal 
                        : imagenesService.construirUrlImagen(item.imagen_principal))
                    : null;
                  
                  const imageKey = `${item.id_producto}-${item.imagen_principal || 'no-image'}`;
                  const hasError = imageErrors.has(imageKey);
                  
                  if (!imagenUrl || hasError) {
                    return (
                      <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '250px' }}>
                        <BiPackage className="display-4 text-muted" />
                      </div>
                    );
                  }
                  
                  return (
                    <img
                      src={imagenUrl}
                      className="card-img-top"
                      alt={item.nombre_producto || 'Producto'}
                      style={{ height: '250px', objectFit: 'cover' }}
                      onError={() => {
                        console.error('Error cargando imagen:', imagenUrl);
                        setImageErrors(prev => new Set(prev).add(imageKey));
                      }}
                    />
                  );
                })()}
              </Link>

              <div className="card-body d-flex flex-column">
                <Link to={`/productos/${item.id_producto}`} className="text-decoration-none text-dark">
                  <h5 className="card-title fw-bold mb-2">{item.nombre_producto}</h5>
                  {item.descripcion_producto && (
                    <p className="card-text text-muted small mb-3">
                      {item.descripcion_producto.length > 100
                        ? `${item.descripcion_producto.substring(0, 100)}...`
                        : item.descripcion_producto}
                    </p>
                  )}
                </Link>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="h5 fw-bold text-primary mb-0">
                        ${item.precio?.toLocaleString()}
                      </span>
                      <small className="text-muted d-block">
                        / {item.unidad_medida}
                      </small>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Stock:</small>
                      <span className={`badge ${(item.stock || 0) > 0 ? 'bg-success' : 'bg-danger'}`}>
                        {item.stock || 0}
                      </span>
                    </div>
                  </div>

                  {item.nombre_productor && (
                    <p className="text-muted small mb-3">
                      <i className="bi bi-person me-1"></i>
                      {item.nombre_productor}
                    </p>
                  )}

                  <div className="d-flex gap-2">
                    <Link
                      to={`/productos/${item.id_producto}`}
                      className="btn btn-primary btn-sm flex-fill"
                    >
                      <BiCart className="me-1" />
                      Ver Detalles
                    </Link>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleEliminar(item.id_lista, item.id_producto)}
                      disabled={eliminarMutation.isPending}
                    >
                      <BiTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        show={showDeleteModal.show}
        onClose={() => setShowDeleteModal({ show: false })}
        onConfirm={confirmEliminar}
        title="Eliminar Producto"
        message="¿Eliminar este producto de tu lista de deseos?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />

      <ConfirmModal
        show={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmLimpiar}
        title="Limpiar Lista de Deseos"
        message="¿Eliminar todos los productos de tu lista de deseos?"
        confirmText="Eliminar Todo"
        cancelText="Cancelar"
        variant="danger"
        isLoading={limpiarMutation.isPending}
      />
    </div>
  );
};

export default ListaDeseosPage;
