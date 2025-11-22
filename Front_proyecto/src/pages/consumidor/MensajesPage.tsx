import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajesService, productosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BiMessageSquare, 
  BiSend, 
  BiCheck, 
  BiUser, 
  BiTime, 
  BiEnvelope, 
  BiPackage,
  BiSearch,
  BiX
} from 'react-icons/bi';
import './MensajesPage.css';

const MensajesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'recibidos' | 'enviados'>('enviados'); // Por defecto enviados para iniciar conversación
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState({ 
    asunto: '', 
    mensaje: '', 
    id_destinatario: 0,
    id_producto: undefined as number | undefined
  });
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Obtener parámetros de URL para iniciar conversación
  const productorIdParam = searchParams.get('productor');
  const productoIdParam = searchParams.get('producto');

  // Query para obtener producto si viene en URL
  const { data: productoFromUrl } = useQuery({
    queryKey: ['producto', productoIdParam],
    queryFn: async () => {
      if (!productoIdParam) return null;
      const response = await productosService.obtenerProducto(parseInt(productoIdParam));
      return response.data || null;
    },
    enabled: !!productoIdParam,
  });

  // Efecto para inicializar conversación desde URL
  useEffect(() => {
    if (productorIdParam && !selectedConversation) {
      const productorId = parseInt(productorIdParam);
      if (!isNaN(productorId)) {
        setSelectedConversation(productorId);
        setNewMessage({ 
          asunto: '', 
          mensaje: '', 
          id_destinatario: productorId,
          id_producto: productoIdParam ? parseInt(productoIdParam) : undefined
        });
        setActiveTab('enviados'); // Cambiar a enviados para iniciar conversación
        // Limpiar parámetros de URL después de usarlos
        setTimeout(() => {
          setSearchParams({});
        }, 1000);
      }
    }
  }, [productorIdParam, selectedConversation, productoIdParam, setSearchParams]);

  // Efecto para establecer producto seleccionado si viene de URL
  useEffect(() => {
    if (productoFromUrl && !selectedProduct) {
      setSelectedProduct(productoFromUrl);
      if (!newMessage.asunto) {
        setNewMessage({ ...newMessage, asunto: `Consulta sobre ${productoFromUrl.nombre}` });
      }
    }
  }, [productoFromUrl]);

  // Scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  // Obtener mensajes recibidos
  const { data: mensajesRecibidos, isLoading: loadingRecibidos, refetch: refetchRecibidos } = useQuery({
    queryKey: ['mensajes', 'consumidor', 'recibidos', user?.id_usuario],
    queryFn: async () => {
      try {
        const response = await mensajesService.obtenerMensajesRecibidos();
        return response.data || [];
      } catch (error) {
        console.error('Error obteniendo mensajes recibidos:', error);
        return [];
      }
    },
    enabled: !!user?.id_usuario,
    retry: 1,
    refetchInterval: 5000,
  });

  // Obtener mensajes enviados
  const { data: mensajesEnviados, isLoading: loadingEnviados, refetch: refetchEnviados } = useQuery({
    queryKey: ['mensajes', 'consumidor', 'enviados', user?.id_usuario],
    queryFn: async () => {
      try {
        const response = await mensajesService.obtenerMensajesEnviados();
        return response.data || [];
      } catch (error) {
        console.error('Error obteniendo mensajes enviados:', error);
        return [];
      }
    },
    enabled: !!user?.id_usuario,
    retry: 1,
    refetchInterval: 5000,
  });

  // Buscar productos para selector
  const { data: productosBusqueda, isLoading: loadingProductos } = useQuery({
    queryKey: ['productos', 'busqueda', productSearchQuery],
    queryFn: async () => {
      if (!productSearchQuery || productSearchQuery.length < 2) return [];
      const response = await productosService.listarProductos({
        nombre: productSearchQuery,
        limite: 10
      });
      return response.data || [];
    },
    enabled: showProductSearch && productSearchQuery.length >= 2,
  });

  // Mutation para enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof newMessage) => {
      const response = await mensajesService.enviarMensaje({
        id_destinatario: data.id_destinatario,
        id_producto: data.id_producto,
        asunto: data.asunto,
        mensaje: data.mensaje,
        tipo_mensaje: data.id_producto ? 'consulta' : 'general',
      });
      if (!response.success) {
        throw new Error(response.message || 'Error al enviar mensaje');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Mensaje enviado correctamente');
      setNewMessage({ asunto: '', mensaje: '', id_destinatario: 0, id_producto: undefined });
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'consumidor'] });
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'conversacion'] });
      if (selectedConversation) {
        setTimeout(() => {
          refetchConversacion();
          refetchRecibidos();
          refetchEnviados();
        }, 500);
      }
      setTimeout(scrollToBottom, 300);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar mensaje');
    },
  });

  // Mutation para marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: async (id_mensaje: number) => {
      return await mensajesService.marcarComoLeido(id_mensaje);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'consumidor'] });
    },
  });

  // Mutation para eliminar mensaje
  const deleteMessageMutation = useMutation({
    mutationFn: async (id_mensaje: number) => {
      return await mensajesService.eliminarMensaje(id_mensaje);
    },
    onSuccess: () => {
      toast.success('Mensaje eliminado');
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'consumidor'] });
    },
    onError: () => {
      toast.error('Error al eliminar mensaje');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation) {
      toast.error('Selecciona una conversación para enviar un mensaje');
      return;
    }
    if (!newMessage.mensaje || !newMessage.mensaje.trim()) {
      toast.error('Por favor escribe un mensaje');
      return;
    }
    // Si no hay asunto, usar uno por defecto
    const asunto = newMessage.asunto.trim() || 
                   (conversacionActual?.ultimoMensaje?.asunto && conversacionActual.ultimoMensaje.asunto !== 'Sin asunto'
                     ? `Re: ${conversacionActual.ultimoMensaje.asunto}`
                     : selectedProduct 
                       ? `Consulta sobre ${selectedProduct.nombre}`
                       : 'Consulta');
    
    sendMessageMutation.mutate({
      ...newMessage,
      asunto,
      id_destinatario: selectedConversation,
      id_producto: selectedProduct?.id_producto,
    });
  };

  const mensajes = activeTab === 'recibidos' ? (mensajesRecibidos || []) : (mensajesEnviados || []);
  const isLoading = activeTab === 'recibidos' ? loadingRecibidos : loadingEnviados;

  // Agrupar mensajes por conversación (por productor)
  const conversaciones = React.useMemo(() => {
    if (!mensajes || !Array.isArray(mensajes) || mensajes.length === 0) {
      return [];
    }
    
    const grouped: Record<number, any[]> = {};
    mensajes.forEach((msg: any) => {
      // Para recibidos: agrupar por remitente (productor que envió)
      // Para enviados: agrupar por destinatario (productor que recibió)
      let productorId: number | null = null;
      
      if (activeTab === 'recibidos') {
        // Mensajes recibidos: el remitente es el productor
        productorId = msg.id_remitente || msg.id_usuario_remitente || null;
      } else {
        // Mensajes enviados: el destinatario es el productor
        productorId = msg.id_destinatario || msg.id_usuario_destinatario || null;
      }
      
      if (!productorId || productorId === user?.id_usuario) {
        return; // Saltar mensajes propios
      }
      
      if (!grouped[productorId]) {
        grouped[productorId] = [];
      }
      grouped[productorId].push(msg);
    });

    return Object.entries(grouped).map(([userId, msgs]) => {
      // Ordenar mensajes por fecha (más reciente primero)
      const mensajesOrdenados = msgs.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_envio || a.fecha_creacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha_envio || b.fecha_creacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      });
      
      const primerMensaje = mensajesOrdenados[0];
      
      // Obtener información del productor desde campos directos del mensaje
      const productorNombre = activeTab === 'recibidos'
        ? (primerMensaje.nombre_remitente || `Productor #${userId}`)
        : (primerMensaje.nombre_destinatario || `Productor #${userId}`);
      
      const productorEmail = activeTab === 'recibidos'
        ? (primerMensaje.email_remitente || '')
        : (primerMensaje.email_destinatario || '');
      
      return {
        userId: Number(userId),
        mensajes: mensajesOrdenados,
        ultimoMensaje: mensajesOrdenados[0],
        noLeidos: mensajesOrdenados.filter((m: any) => !m.leido && activeTab === 'recibidos').length,
        productorNombre,
        productorEmail,
      };
    });
  }, [mensajes, activeTab, user?.id_usuario]);

  const conversacionActual = conversaciones.find(c => c.userId === selectedConversation);
  
  // Obtener TODA la conversación (recibidos + enviados) cuando se selecciona una conversación
  const { data: conversacionCompleta, refetch: refetchConversacion } = useQuery({
    queryKey: ['mensajes', 'conversacion', user?.id_usuario, selectedConversation],
    queryFn: async () => {
      if (!selectedConversation || !user?.id_usuario) return [];
      try {
        const response = await mensajesService.obtenerConversacion(selectedConversation);
        if (response.success && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      } catch (error) {
        console.error('Error obteniendo conversación:', error);
        return [];
      }
    },
    enabled: !!selectedConversation && !!user?.id_usuario,
    refetchInterval: 3000, // Actualizar cada 3 segundos para acercarnos a tiempo real
  });
  
  // Usar la conversación completa si está disponible, sino usar la agrupada
  const mensajesConversacion = conversacionCompleta && conversacionCompleta.length > 0 
    ? conversacionCompleta 
    : (conversacionActual?.mensajes || []);
  
  // Scroll cuando hay nuevos mensajes en la conversación
  useEffect(() => {
    if (mensajesConversacion.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [mensajesConversacion.length]);

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-6 fw-bold mb-2">
            <BiMessageSquare className="me-2" />
            Mis Mensajes
          </h1>
          <p className="text-muted">Comunícate con los productores sobre sus productos</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Lista de conversaciones */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'recibidos' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('recibidos');
                      setSelectedConversation(null);
                    }}
                  >
                    Recibidos
                    {activeTab === 'recibidos' && mensajesRecibidos && (
                      <span className="badge bg-danger ms-2">
                        {mensajesRecibidos.filter((m: any) => !m.leido).length}
                      </span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'enviados' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('enviados');
                      setSelectedConversation(null);
                    }}
                  >
                    Enviados
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : conversaciones.length === 0 ? (
                <div className="text-center py-5">
                  <BiMessageSquare className="display-4 text-muted mb-3" />
                  <p className="text-muted">
                    {activeTab === 'recibidos' 
                      ? 'No hay mensajes recibidos de productores' 
                      : 'No has enviado mensajes a productores'}
                  </p>
                  <small className="text-muted d-block mt-2">
                    Puedes contactar productores desde la página de productos
                  </small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {conversaciones.map((conv) => (
                    <button
                      key={conv.userId}
                      className={`list-group-item list-group-item-action ${
                        selectedConversation === conv.userId ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv.userId);
                        setNewMessage({ asunto: '', mensaje: '', id_destinatario: conv.userId, id_producto: undefined });
                        setSelectedProduct(null);
                        // Marcar como leído los mensajes recibidos
                        if (activeTab === 'recibidos' && conv.noLeidos > 0) {
                          conv.mensajes.forEach((msg: any) => {
                            if (!msg.leido && msg.id_remitente === conv.userId) {
                              markAsReadMutation.mutate(msg.id_mensaje);
                            }
                          });
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <BiUser className="fs-5" />
                            <strong>{conv.productorNombre}</strong>
                            {conv.noLeidos > 0 && (
                              <span className="badge bg-danger ms-2">
                                {conv.noLeidos}
                              </span>
                            )}
                          </div>
                          <p className="mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                            {conv.ultimoMensaje.asunto || 'Sin asunto'}
                          </p>
                          {conv.ultimoMensaje.nombre_producto && (
                            <small className="text-info d-block mb-1">
                              <BiPackage className="me-1" />
                              {conv.ultimoMensaje.nombre_producto}
                            </small>
                          )}
                          <small className="text-muted d-block">
                            <BiTime className="me-1" />
                            {(() => {
                              const fecha = conv.ultimoMensaje.fecha_envio || conv.ultimoMensaje.fecha_creacion || conv.ultimoMensaje.fecha;
                              return fecha ? new Date(fecha).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Fecha no disponible';
                            })()}
                          </small>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Área de conversación - Chat real */}
        <div className="col-md-8">
          {selectedConversation && conversacionActual ? (
            <div className="card border-0 shadow-sm h-100 d-flex flex-column">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <h5 className="mb-1">
                      <BiUser className="me-2" />
                      {conversacionActual.productorNombre}
                    </h5>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      {conversacionActual.productorEmail && (
                        <span>
                          <BiEnvelope className="me-1" />
                          {conversacionActual.productorEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Área de mensajes - Chat estilo WhatsApp */}
              <div 
                className="card-body flex-grow-1 p-3 messages-area" 
                style={{ 
                  overflowY: 'auto', 
                  maxHeight: '500px', 
                  backgroundColor: '#e5ddd5',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'%23d4d4d4\' stroke-width=\'0.5\'/%3E%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\' /%3E%3C/svg%3E")'
                }}
              >
                {mensajesConversacion && mensajesConversacion.length > 0 ? (
                  <>
                    {mensajesConversacion.map((msg: any, index: number) => {
                      const esMio = (msg.id_remitente === user?.id_usuario) || (msg.id_usuario_remitente === user?.id_usuario);
                      const fechaMensaje = msg.fecha_envio || msg.fecha_creacion || msg.fecha;
                      const fechaAnterior = index > 0 
                        ? (mensajesConversacion[index - 1].fecha_envio || mensajesConversacion[index - 1].fecha_creacion || mensajesConversacion[index - 1].fecha)
                        : null;
                      
                      // Mostrar fecha si es un nuevo día
                      const mostrarFecha = !fechaAnterior || 
                        new Date(fechaMensaje).toDateString() !== new Date(fechaAnterior).toDateString();
                      
                      return (
                        <React.Fragment key={msg.id_mensaje || msg.id || index}>
                          {mostrarFecha && (
                            <div className="text-center my-3">
                              <span className="badge bg-secondary bg-opacity-50 px-3 py-1">
                                {new Date(fechaMensaje).toLocaleDateString('es-CO', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          <div className={`d-flex mb-2 ${esMio ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div
                              className={`message-bubble p-3 shadow-sm ${
                                esMio ? 'mine' : 'other'
                              }`}
                              style={{ 
                                maxWidth: '70%',
                                wordWrap: 'break-word'
                              }}
                            >
                              {!esMio && (
                                <div className="small fw-bold mb-1 opacity-75">
                                  {msg.nombre_remitente || 'Productor'}
                                </div>
                              )}
                              {msg.asunto && msg.asunto !== 'Sin asunto' && (
                                <div className={`small mb-2 ${esMio ? 'opacity-90' : 'text-muted'}`}>
                                  <strong>{msg.asunto}</strong>
                                </div>
                              )}
                              {msg.nombre_producto && (
                                <div className={`small mb-2 ${esMio ? 'opacity-90' : 'text-info'}`}>
                                  <BiPackage className="me-1" />
                                  <Link 
                                    to={`/productos/${msg.id_producto}`}
                                    className={esMio ? 'text-white' : 'text-info'}
                                    style={{ textDecoration: 'underline' }}
                                  >
                                    {msg.nombre_producto}
                                  </Link>
                                </div>
                              )}
                              <div style={{ whiteSpace: 'pre-wrap' }}>
                                {msg.mensaje || msg.contenido || ''}
                              </div>
                              <div className={`d-flex align-items-center gap-2 mt-2 ${esMio ? 'justify-content-end' : 'justify-content-start'}`}>
                                <small className={esMio ? 'opacity-75' : 'text-muted'} style={{ fontSize: '0.7rem' }}>
                                  {fechaMensaje ? new Date(fechaMensaje).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ''}
                                </small>
                                {esMio && (
                                  <BiCheck 
                                    className={msg.leido ? 'text-info' : 'opacity-50'} 
                                    style={{ fontSize: '0.9rem' }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center py-5">
                    <BiMessageSquare className="display-4 text-muted mb-3" />
                    <p className="text-muted">No hay mensajes en esta conversación</p>
                    <small className="text-muted d-block mt-2">
                      Comienza la conversación enviando un mensaje
                    </small>
                  </div>
                )}
              </div>
              
              {/* Formulario de envío - Estilo chat */}
              <div className="card-footer bg-white border-top p-3">
                <form onSubmit={handleSendMessage}>
                  {/* Selector de producto (opcional) */}
                  {!selectedProduct ? (
                    <div className="mb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={() => setShowProductSearch(!showProductSearch)}
                      >
                        <BiPackage className="me-1" />
                        {showProductSearch ? 'Ocultar' : 'Vincular producto (opcional)'}
                      </button>
                      {showProductSearch && (
                        <div className="mt-2 position-relative">
                          <div className="input-group">
                            <span className="input-group-text">
                              <BiSearch />
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Buscar producto..."
                              value={productSearchQuery}
                              onChange={(e) => setProductSearchQuery(e.target.value)}
                            />
                          </div>
                          {loadingProductos ? (
                            <div className="text-center py-2">
                              <div className="spinner-border spinner-border-sm text-primary" />
                            </div>
                          ) : productosBusqueda && productosBusqueda.length > 0 ? (
                            <div className="list-group mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {productosBusqueda.map((producto: any) => (
                                <button
                                  key={producto.id_producto}
                                  type="button"
                                  className="list-group-item list-group-item-action"
                                  onClick={() => {
                                    setSelectedProduct(producto);
                                    setShowProductSearch(false);
                                    setProductSearchQuery('');
                                    if (!newMessage.asunto) {
                                      setNewMessage({ ...newMessage, asunto: `Consulta sobre ${producto.nombre}` });
                                    }
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    {producto.imagenUrl && (
                                      <img 
                                        src={producto.imagenUrl} 
                                        alt={producto.nombre}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                      />
                                    )}
                                    <div className="flex-grow-1">
                                      <strong>{producto.nombre}</strong>
                                      <div className="small text-muted">
                                        ${producto.precio?.toLocaleString()} / {producto.unidad_medida}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : productSearchQuery.length >= 2 ? (
                            <div className="text-center py-2 text-muted small">
                              No se encontraron productos
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="alert alert-info d-flex justify-content-between align-items-center py-2 mb-0">
                        <div className="d-flex align-items-center gap-2">
                          <BiPackage />
                          <span>
                            <strong>Producto:</strong> {selectedProduct.nombre}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            setSelectedProduct(null);
                            setNewMessage({ ...newMessage, id_producto: undefined });
                          }}
                        >
                          <BiX />
                        </button>
                      </div>
                    </div>
                  )}

                  {!conversacionActual?.ultimoMensaje?.asunto || conversacionActual.ultimoMensaje.asunto === 'Sin asunto' ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Asunto (opcional)"
                        value={newMessage.asunto}
                        onChange={(e) => setNewMessage({ ...newMessage, asunto: e.target.value })}
                      />
                    </div>
                  ) : null}
                  
                  <div className="input-group">
                    <textarea
                      className="form-control"
                      placeholder="Escribe tu mensaje..."
                      rows={1}
                      value={newMessage.mensaje}
                      onChange={(e) => {
                        setNewMessage({ ...newMessage, mensaje: e.target.value });
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.mensaje.trim()) {
                            handleSendMessage(e as any);
                          }
                        }
                      }}
                      required
                      style={{ resize: 'none', minHeight: '40px', maxHeight: '120px' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={sendMessageMutation.isPending || !selectedConversation || !newMessage.mensaje.trim()}
                      style={{ minWidth: '50px' }}
                    >
                      {sendMessageMutation.isPending ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <BiSend />
                      )}
                    </button>
                  </div>
                  <small className="text-muted mt-2 d-block">
                    Presiona Enter para enviar, Shift+Enter para nueva línea
                  </small>
                </form>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center">
              <div className="text-center py-5">
                <BiMessageSquare className="display-1 text-muted mb-3" />
                <p className="text-muted">Selecciona una conversación para ver los mensajes</p>
                <small className="text-muted d-block mt-2">
                  Puedes contactar productores desde la página de productos
                </small>
                <Link to="/productos" className="btn btn-primary mt-3">
                  <BiPackage className="me-2" />
                  Ver Productos
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MensajesPage;
