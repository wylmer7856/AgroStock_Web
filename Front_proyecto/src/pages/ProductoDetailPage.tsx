import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productosService, historialPreciosService, listaDeseosService, carritoService, productoresService, mensajesService } from '../services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  BiLeftArrowAlt, 
  BiCart, 
  BiHeart, 
  BiPackage, 
  BiUser, 
  BiMapPin,
  BiTrendingUp,
  BiTrendingDown,
  BiCheckCircle,
  BiXCircle,
  BiInfoCircle,
  BiMessageSquare,
  BiLeftArrow,
  BiRightArrow,
  BiPhone,
  BiEnvelope,
  BiStore,
  BiAward,
  BiCalendar
} from 'react-icons/bi';
import imagenesService from '../services/imagenes';
import { format } from 'date-fns';
import './ProductoDetailPage.css';

const ProductoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [cantidad, setCantidad] = useState(1);
  const [showMensajeModal, setShowMensajeModal] = useState(false);
  const [mensajeForm, setMensajeForm] = useState({
    asunto: '',
    mensaje: ''
  });

  // Query para producto
  const { data: producto, isLoading } = useQuery({
    queryKey: ['producto', id],
    queryFn: async () => {
      if (!id) throw new Error('ID no válido');
      const response = await productosService.obtenerProducto(parseInt(id));
      return response.data;
    },
    enabled: !!id,
  });

  // Query para historial de precios
  const { data: historialData } = useQuery({
    queryKey: ['historial-precios', id],
    queryFn: async () => {
      if (!id) return [];
      const response = await historialPreciosService.obtenerHistorialPorProducto(parseInt(id));
      return response.data || [];
    },
    enabled: !!id,
  });

  // Query para verificar si está en lista de deseos
  const { data: estaEnLista } = useQuery({
    queryKey: ['lista-deseos-verificar', id],
    queryFn: async () => {
      if (!id || !isAuthenticated || user?.rol !== 'consumidor') return false;
      const response = await listaDeseosService.verificarProductoEnLista(parseInt(id));
      return response.data || false;
    },
    enabled: !!id && isAuthenticated && user?.rol === 'consumidor',
  });

  // Query para obtener información del productor
  const { data: productor } = useQuery({
    queryKey: ['productor', producto?.id_usuario],
    queryFn: async () => {
      if (!producto?.id_usuario) return null;
      const response = await productoresService.obtenerPorUsuario(producto.id_usuario);
      return response.data || null;
    },
    enabled: !!producto?.id_usuario,
  });

  const historial = historialData || [];
  
  // Construir array de todas las imágenes (principal + adicionales) usando useMemo
  const todasLasImagenes = useMemo(() => {
    const imagenes: string[] = [];
    
    // Agregar imagen principal si existe
    if (producto?.imagen_principal) {
      const imagenPrincipalUrl = producto.imagenUrl || 
        (producto.imagen_principal.startsWith('http') 
          ? producto.imagen_principal 
          : imagenesService.construirUrlImagen(producto.imagen_principal));
      if (imagenPrincipalUrl) {
        imagenes.push(imagenPrincipalUrl);
      }
    }
    
    // Agregar imágenes adicionales si existen
    if (producto?.imagenes_adicionales) {
      let imagenesAdicionales: string[] = [];
      try {
        if (typeof producto.imagenes_adicionales === 'string') {
          imagenesAdicionales = JSON.parse(producto.imagenes_adicionales);
        } else if (Array.isArray(producto.imagenes_adicionales)) {
          imagenesAdicionales = producto.imagenes_adicionales;
        }
        imagenesAdicionales.forEach((img: string) => {
          const imgUrl = imagenesService.construirUrlImagen(img);
          if (imgUrl) {
            imagenes.push(imgUrl);
          }
        });
      } catch (error) {
        console.error('Error parseando imágenes adicionales:', error);
      }
    }
    
    return imagenes;
  }, [producto?.imagen_principal, producto?.imagenUrl, producto?.imagenes_adicionales]);
  
  const [imagenActualIndex, setImagenActualIndex] = useState(0);
  
  // Reiniciar índice cuando cambie el producto
  useEffect(() => {
    setImagenActualIndex(0);
  }, [producto?.id_producto]);
  
  const siguienteImagen = () => {
    if (todasLasImagenes.length > 0) {
      setImagenActualIndex((prev) => (prev + 1) % todasLasImagenes.length);
    }
  };

  const anteriorImagen = () => {
    if (todasLasImagenes.length > 0) {
      setImagenActualIndex((prev) => (prev - 1 + todasLasImagenes.length) % todasLasImagenes.length);
    }
  };

  // Mutation para agregar al carrito
  const agregarAlCarritoMutation = useMutation({
    mutationFn: async () => {
      if (!producto || !id) throw new Error('Producto no válido');
      return await carritoService.agregarAlCarrito({
        id_producto: parseInt(id),
        cantidad: cantidad,
      });
    },
    onSuccess: () => {
      toast.success(`${cantidad} ${producto?.unidad_medida || 'unidad(es)'} agregado(s) al carrito`);
      queryClient.invalidateQueries({ queryKey: ['carrito'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar al carrito');
    },
  });

  const handleAgregarAlCarrito = async () => {
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para agregar productos al carrito');
      navigate('/login', { state: { from: `/productos/${id}` } });
      return;
    }
    if (!producto || producto.stock < cantidad) {
      toast.error('No hay suficiente stock disponible');
      return;
    }
    agregarAlCarritoMutation.mutate();
  };

  // Mutation para lista de deseos
  const toggleListaDeseosMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID no válido');
      if (estaEnLista) {
        return await listaDeseosService.eliminarProductoDeListaDeseos(parseInt(id));
      } else {
        return await listaDeseosService.agregarAListaDeseos(parseInt(id));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-deseos-verificar', id] });
      queryClient.invalidateQueries({ queryKey: ['lista-deseos'] });
      toast.success(estaEnLista ? 'Eliminado de la lista de deseos' : 'Agregado a la lista de deseos');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar lista de deseos');
    },
  });

  const handleToggleListaDeseos = async () => {
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para usar la lista de deseos');
      navigate('/login', { state: { from: `/productos/${id}` } });
      return;
    }

    if (!id) return;
    toggleListaDeseosMutation.mutate();
  };

  // Mutation para enviar mensaje al productor
  const enviarMensajeMutation = useMutation({
    mutationFn: async (data: { asunto: string; mensaje: string }) => {
      if (!producto?.id_usuario || !id) {
        throw new Error('Información del producto o productor no disponible');
      }
      return await mensajesService.enviarMensaje({
        id_destinatario: producto.id_usuario,
        id_producto: parseInt(id),
        asunto: data.asunto,
        mensaje: data.mensaje,
        tipo_mensaje: 'consulta'
      });
    },
    onSuccess: () => {
      toast.success('✅ Mensaje enviado correctamente al productor');
      setShowMensajeModal(false);
      setMensajeForm({ asunto: '', mensaje: '' });
      queryClient.invalidateQueries({ queryKey: ['mensajes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar el mensaje');
    },
  });

  const handleAbrirMensajeModal = () => {
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para enviar mensajes');
      navigate('/login', { state: { from: `/productos/${id}` } });
      return;
    }
    // Inicializar el asunto con el nombre del producto
    setMensajeForm({
      asunto: producto ? `Consulta sobre: ${producto.nombre}` : '',
      mensaje: ''
    });
    setShowMensajeModal(true);
  };

  const handleEnviarMensaje = () => {
    if (!mensajeForm.asunto.trim() || !mensajeForm.mensaje.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    enviarMensajeMutation.mutate(mensajeForm);
  };

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showMensajeModal) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return;
  }, [showMensajeModal]);

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <h2>Producto no encontrado</h2>
          <Link to="/productos" className="btn btn-primary">
            <BiLeftArrowAlt className="me-2" />
            Volver a Productos
          </Link>
        </div>
      </div>
    );
  }

  const mensajeModalPortal = showMensajeModal
    ? createPortal(
        <div 
          style={{ 
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 1055,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMensajeModal(false);
            }
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <BiMessageSquare className="me-2" />
                Enviar Mensaje al Productor
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowMensajeModal(false)}
                disabled={enviarMensajeMutation.isPending}
              ></button>
            </div>
            <div className="modal-body">
              {producto && (
                <div className="mb-3 p-3 bg-light rounded">
                  <small className="text-muted d-block mb-1">Producto:</small>
                  <strong>{producto.nombre}</strong>
                  {producto.nombre_productor && (
                    <>
                      <small className="text-muted d-block mt-1 mb-1">Productor:</small>
                      <strong>{producto.nombre_productor}</strong>
                    </>
                  )}
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="asunto-mensaje" className="form-label fw-bold">
                  Asunto <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="asunto-mensaje"
                  className="form-control"
                  value={mensajeForm.asunto}
                  onChange={(e) => setMensajeForm({ ...mensajeForm, asunto: e.target.value })}
                  placeholder="Ej: Consulta sobre disponibilidad"
                  disabled={enviarMensajeMutation.isPending}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="mensaje-texto" className="form-label fw-bold">
                  Mensaje <span className="text-danger">*</span>
                </label>
                <textarea
                  id="mensaje-texto"
                  className="form-control"
                  rows={6}
                  value={mensajeForm.mensaje}
                  onChange={(e) => setMensajeForm({ ...mensajeForm, mensaje: e.target.value })}
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={enviarMensajeMutation.isPending}
                  required
                />
                <small className="text-muted">
                  El mensaje será enviado al productor junto con la referencia del producto.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowMensajeModal(false);
                  setMensajeForm({ asunto: '', mensaje: '' });
                }}
                disabled={enviarMensajeMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEnviarMensaje}
                disabled={enviarMensajeMutation.isPending || !mensajeForm.asunto.trim() || !mensajeForm.mensaje.trim()}
              >
                {enviarMensajeMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <BiMessageSquare className="me-2" />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
    <div className="container py-4 product-detail-page">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">Inicio</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/productos" className="text-decoration-none">Productos</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {producto.nombre}
          </li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Imágenes */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm product-image-gallery">
            <div className="card-body p-0">
              <div className="d-flex align-items-center" style={{ position: 'relative' }}>
                {todasLasImagenes.length > 1 && (
                  <button
                    type="button"
                    onClick={anteriorImagen}
                    className="btn"
                    style={{ 
                      background: 'white',
                      color: '#333',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '28px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      fontWeight: 'bold',
                      margin: 0,
                      padding: 0,
                      flexShrink: 0,
                      marginRight: '10px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                    }}
                    title="Imagen anterior"
                  >
                    <BiLeftArrow />
                  </button>
                )}
                <div className="position-relative" style={{ flex: 1, overflow: 'hidden' }}>
                  {todasLasImagenes.length > 0 ? (
                    <>
                      <img
                        src={todasLasImagenes[imagenActualIndex]}
                        className="img-fluid w-100 product-image-main"
                        alt={producto.nombre}
                        style={{ height: '500px', objectFit: 'cover', width: '100%', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x500?text=Sin+Imagen';
                        }}
                      />
                      {!producto.disponible && (
                        <div className="position-absolute top-0 start-0 m-3">
                          <span className="badge bg-danger fs-6 px-3 py-2">Agotado</span>
                        </div>
                      )}
                      {producto.stock > 0 && producto.stock <= (producto.stock_minimo || 5) && producto.disponible && (
                        <div className="position-absolute top-0 end-0 m-3">
                          <span className="badge bg-warning text-dark fs-6 px-3 py-2">Stock Bajo</span>
                        </div>
                      )}
                      {todasLasImagenes.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '15px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '25px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          zIndex: 10
                        }}>
                          {imagenActualIndex + 1} / {todasLasImagenes.length}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <img
                        src={producto.imagenUrl || producto.imagen_principal || '/placeholder.png'}
                        className="img-fluid w-100 product-image-main"
                        alt={producto.nombre}
                        style={{ height: '500px', objectFit: 'cover', width: '100%', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x500?text=Sin+Imagen';
                        }}
                      />
                      {!producto.disponible && (
                        <div className="position-absolute top-0 start-0 m-3">
                          <span className="badge bg-danger fs-6 px-3 py-2">Agotado</span>
                        </div>
                      )}
                      {producto.stock > 0 && producto.stock <= (producto.stock_minimo || 5) && producto.disponible && (
                        <div className="position-absolute top-0 end-0 m-3">
                          <span className="badge bg-warning text-dark fs-6 px-3 py-2">Stock Bajo</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {todasLasImagenes.length > 1 && (
                  <button
                    type="button"
                    onClick={siguienteImagen}
                    className="btn"
                    style={{ 
                      background: 'white',
                      color: '#333',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '28px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      fontWeight: 'bold',
                      margin: 0,
                      padding: 0,
                      flexShrink: 0,
                      marginLeft: '10px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                    }}
                    title="Siguiente imagen"
                  >
                    <BiRightArrow />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información del Producto */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100 product-info-card">
            <div className="card-body p-4">
              <h1 className="display-5 fw-bold mb-3" style={{ color: '#2d5016' }}>{producto.nombre}</h1>

              {producto.descripcion && (
                <p className="lead text-muted mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                  {producto.descripcion}
                </p>
              )}

              <div className="mb-4 p-3 bg-light rounded">
                <div className="d-flex align-items-baseline gap-3 mb-2">
                  <span className="price-display">
                    ${producto.precio.toLocaleString()}
                  </span>
                  <span className="text-muted fs-5">/ {producto.unidad_medida}</span>
                </div>

                {/* Historial de Precios */}
                {historial.length > 0 && (
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">Último cambio de precio:</small>
                    <div className="d-flex align-items-center gap-2">
                      {historial[0].precio_anterior > historial[0].precio_nuevo ? (
                        <BiTrendingDown className="text-success" />
                      ) : (
                        <BiTrendingUp className="text-danger" />
                      )}
                      <span className="text-muted small">
                        ${historial[0].precio_anterior.toLocaleString()} → ${historial[0].precio_nuevo.toLocaleString()}
                      </span>
                      <span className="text-muted small">
                        ({format(new Date(historial[0].fecha_cambio), 'dd MMM yyyy')})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="border rounded p-3 text-center stock-info-card h-100">
                    <BiPackage className="fs-3 text-primary mb-2" />
                    <div className="fw-bold text-muted small">Stock Disponible</div>
                    <div className={`fs-4 fw-bold ${producto.stock > 0 ? 'text-success' : 'text-danger'}`}>
                      {producto.stock}
                    </div>
                    <small className="text-muted">{producto.unidad_medida}</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3 text-center producer-info-card h-100">
                    <BiUser className="fs-3 text-success mb-2" />
                    <div className="fw-bold text-muted small">Productor</div>
                    <div className="fw-bold text-dark">{producto.nombre_productor || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {producto.ciudad_origen && (
                <div className="mb-4">
                  <BiMapPin className="me-2 text-primary" />
                  <span className="text-muted">
                    Origen: {producto.ciudad_origen}
                    {producto.departamento_origen && `, ${producto.departamento_origen}`}
                  </span>
                </div>
              )}

              {isAuthenticated && user?.rol === 'consumidor' && (
                <div className="border-top pt-4 mt-4">
                  <div className="row g-3 mb-4">
                    <div className="col-5">
                      <label className="form-label fw-bold">Cantidad</label>
                      <input
                        type="number"
                        className="form-control form-control-lg quantity-input"
                        min="1"
                        max={producto.stock}
                        value={cantidad}
                        onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                      />
                    </div>
                    <div className="col-7 d-flex align-items-end">
                      <div className="w-100">
                        <label className="form-label fw-bold text-muted">Total</label>
                        <div className="h3 fw-bold text-primary mb-0">
                          ${(producto.precio * cantidad).toLocaleString()} COP
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 action-buttons mb-3">
                    <button
                      className="btn btn-primary btn-lg flex-fill"
                      onClick={handleAgregarAlCarrito}
                      disabled={!producto.disponible || producto.stock === 0 || agregarAlCarritoMutation.isPending}
                    >
                      {agregarAlCarritoMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Agregando...
                        </>
                      ) : (
                        <>
                          <BiCart className="me-2" />
                          Agregar al Carrito
                        </>
                      )}
                    </button>
                    <button
                      className={`btn btn-lg ${estaEnLista ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={handleToggleListaDeseos}
                      disabled={toggleListaDeseosMutation.isPending}
                      title={estaEnLista ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                      style={{ 
                        minWidth: '60px',
                        backgroundColor: estaEnLista ? undefined : 'rgba(255, 255, 255, 0.95)',
                        borderColor: estaEnLista ? undefined : 'rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {toggleListaDeseosMutation.isPending ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <BiHeart 
                          className={estaEnLista ? 'heart-filled' : 'heart-outline'}
                          style={{ 
                            fontSize: '1.5rem',
                            color: '#dc3545',
                            transition: 'all 0.3s ease'
                          }} 
                        />
                      )}
                    </button>
                  </div>

                  {/* Botón para contactar productor */}
                  {producto.id_usuario && (
                    <button
                      className="btn btn-outline-info btn-lg w-100"
                      onClick={handleAbrirMensajeModal}
                    >
                      <BiMessageSquare className="me-2" />
                      Enviar Mensaje al Productor
                    </button>
                  )}
                  
                  {producto.stock > 0 && producto.stock < 10 && (
                    <div className="alert alert-warning mt-3 mb-0">
                      <small>
                        <BiCheckCircle className="me-1" />
                        Solo quedan {producto.stock} {producto.unidad_medida} disponibles
                      </small>
                    </div>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <div className="alert alert-warning login-required-alert border-warning mt-4">
                  <div className="d-flex align-items-start">
                    <BiXCircle className="me-3 fs-4 mt-1" />
                    <div className="flex-grow-1">
                      <h5 className="alert-heading fw-bold mb-2">Inicia sesión requerido</h5>
                      <p className="mb-3">
                        Debes tener una cuenta de consumidor para agregar productos al carrito o a tu lista de deseos.
                      </p>
                      <div className="d-flex gap-2">
                        <Link to="/login" className="btn btn-primary">
                          Iniciar Sesión
                        </Link>
                        <Link to="/register" className="btn btn-outline-primary">
                          Crear Cuenta
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated && user?.rol !== 'consumidor' && (
                <div className="alert alert-info mt-4">
                  <BiInfoCircle className="me-2" />
                  Solo los consumidores pueden agregar productos al carrito. 
                  <Link to="/register" className="ms-2 fw-bold">Regístrate como consumidor</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información del Productor */}
      {producto.id_usuario && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <BiUser className="me-2" />
                  Información del Productor
                </h5>
              </div>
              <div className="card-body">
                {productor ? (
                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="text-center">
                        {productor.foto_perfil_finca ? (
                          <img
                            src={productor.foto_perfil_finca}
                            alt={productor.nombre_finca || productor.nombre || 'Productor'}
                            className="img-fluid rounded-circle mb-3"
                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120?text=Productor';
                            }}
                          />
                        ) : (
                          <div className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '120px', height: '120px' }}>
                            <BiUser style={{ fontSize: '4rem', color: 'white' }} />
                          </div>
                        )}
                        <h4 className="fw-bold">{productor.nombre_finca || productor.nombre || 'Productor'}</h4>
                        {productor.nombre && productor.nombre_finca && (
                          <p className="text-muted mb-0">{productor.nombre}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="row g-3">
                        {productor.email && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiEnvelope className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Email</small>
                                <strong>{productor.email}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.telefono && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiPhone className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Teléfono</small>
                                <strong>{productor.telefono}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.direccion_finca && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiMapPin className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Dirección</small>
                                <strong>{productor.direccion_finca}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {(productor.ciudad_nombre || productor.departamento_nombre) && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiMapPin className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Ubicación</small>
                                <strong>
                                  {productor.ciudad_nombre || ''}
                                  {productor.ciudad_nombre && productor.departamento_nombre && ', '}
                                  {productor.departamento_nombre || ''}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.tipo_productor && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiStore className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Tipo de Productor</small>
                                <strong className="text-capitalize">{productor.tipo_productor}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.anos_experiencia && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiCalendar className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Años de Experiencia</small>
                                <strong>{productor.anos_experiencia} años</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.metodo_produccion && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiLeaf className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Método de Producción</small>
                                <strong className="text-capitalize">{productor.metodo_produccion}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.certificaciones && (
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <BiAward className="me-2 text-primary" style={{ fontSize: '1.5rem' }} />
                              <div>
                                <small className="text-muted d-block">Certificaciones</small>
                                <strong>{productor.certificaciones}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        {productor.descripcion_actividad && (
                          <div className="col-12">
                            <div className="mb-2">
                              <small className="text-muted d-block mb-1">Descripción de la Actividad</small>
                              <p className="mb-0">{productor.descripcion_actividad}</p>
                            </div>
                          </div>
                        )}
                        {producto.id_usuario && isAuthenticated && user?.rol === 'consumidor' && (
                          <div className="col-12 mt-3">
                            <button
                              className="btn btn-success"
                              onClick={handleAbrirMensajeModal}
                            >
                              <BiMessageSquare className="me-2" />
                              Enviar Mensaje al Productor
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BiUser className="fs-1 text-muted mb-3" />
                    <h5>{producto.nombre_productor || 'Productor'}</h5>
                    {producto.id_usuario && isAuthenticated && user?.rol === 'consumidor' && (
                      <button
                        className="btn btn-success mt-3"
                        onClick={handleAbrirMensajeModal}
                      >
                        <BiMessageSquare className="me-2" />
                        Enviar Mensaje al Productor
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para enviar mensaje al productor */}
      {mensajeModalPortal}

      {/* Historial de Precios */}
      {historial.length > 0 && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Historial de Precios</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Precio Anterior</th>
                        <th>Precio Nuevo</th>
                        <th>Cambio</th>
                        <th>Modificado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item) => (
                        <tr key={item.id_historial}>
                          <td>
                            {format(new Date(item.fecha_cambio), 'dd MMM yyyy HH:mm')}
                          </td>
                          <td>${item.precio_anterior.toLocaleString()}</td>
                          <td className="fw-bold">${item.precio_nuevo.toLocaleString()}</td>
                          <td>
                            {item.precio_nuevo > item.precio_anterior ? (
                              <span className="text-danger">
                                <BiTrendingUp className="me-1" />
                                +${(item.precio_nuevo - item.precio_anterior).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-success">
                                <BiTrendingDown className="me-1" />
                                -${(item.precio_anterior - item.precio_nuevo).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td>{item.nombre_usuario_modifico || 'Sistema'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    {mensajeModalPortal}
    </>
  );
};

export default ProductoDetailPage;
