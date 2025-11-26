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
  const [lastMessageCount, setLastMessageCount] = useState(0);

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

  // Scroll al final solo cuando hay nuevos mensajes (no al seleccionar conversación)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Obtener mensajes recibidos
  const { data: mensajesRecibidos, isLoading: loadingRecibidos } = useQuery({
    queryKey: ['mensajes', 'consumidor', 'recibidos', user?.id_usuario],
    queryFn: async () => {
      try {
        const response = await mensajesService.obtenerMensajesRecibidos();
        if (response && response.success !== false && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        if (response && response.mensajes && Array.isArray(response.mensajes)) {
          return response.mensajes;
        }
        return [];
      } catch (error: any) {
        if (!error?.message?.includes('405') && !error?.message?.includes('Method Not Allowed')) {
          toast.error('Error al cargar mensajes recibidos');
        }
        return [];
      }
    },
    enabled: !!user?.id_usuario,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Obtener mensajes enviados
  const { data: mensajesEnviados, isLoading: loadingEnviados } = useQuery({
    queryKey: ['mensajes', 'consumidor', 'enviados', user?.id_usuario],
    queryFn: async () => {
      try {
        const response = await mensajesService.obtenerMensajesEnviados();
        if (response && response.success !== false && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        if (response && response.mensajes && Array.isArray(response.mensajes)) {
          return response.mensajes;
        }
        return [];
      } catch (error: any) {
        if (!error?.message?.includes('405') && !error?.message?.includes('Method Not Allowed')) {
          toast.error('Error al cargar mensajes enviados');
        }
        return [];
      }
    },
    enabled: !!user?.id_usuario,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
      setNewMessage({ asunto: '', mensaje: '', id_destinatario: selectedConversation || 0, id_producto: undefined });
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

  // Combinar todos los mensajes (recibidos + enviados)
  const todosLosMensajes = React.useMemo(() => {
    const recibidos = mensajesRecibidos || [];
    const enviados = mensajesEnviados || [];
    return [...recibidos, ...enviados];
  }, [mensajesRecibidos, mensajesEnviados]);

  // Agrupar mensajes por conversación (por productor)
  const conversaciones = React.useMemo(() => {
    if (!todosLosMensajes || !Array.isArray(todosLosMensajes) || todosLosMensajes.length === 0) {
      return [];
    }
    
    const grouped: Record<number, any[]> = {};
    todosLosMensajes.forEach((msg: any) => {
      // Identificar el ID del productor (remitente o destinatario según corresponda)
      let productorId: number | null = null;
      
      if (msg.id_remitente === user?.id_usuario) {
        // Mensaje enviado por el consumidor: el destinatario es el productor
        productorId = msg.id_destinatario || msg.id_usuario_destinatario || null;
      } else {
        // Mensaje recibido: el remitente es el productor
        productorId = msg.id_remitente || msg.id_usuario_remitente || null;
      }
      
      if (!productorId || productorId === user?.id_usuario) {
        return; // Saltar mensajes sin productor o propios
      }
      
      if (!grouped[productorId]) {
        grouped[productorId] = [];
      }
      grouped[productorId].push(msg);
    });

    const conversacionesResult = Object.entries(grouped).map(([userId, msgs]) => {
      // Ordenar mensajes por fecha (más reciente primero)
      const mensajesOrdenados = msgs.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_envio || a.fecha_creacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha_envio || b.fecha_creacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      });
      
      const primerMensaje = mensajesOrdenados[0];
      
      // Obtener información del productor
      const productorNombre = primerMensaje.nombre_remitente === user?.nombre
        ? (primerMensaje.nombre_destinatario || `Productor #${userId}`)
        : (primerMensaje.nombre_remitente || `Productor #${userId}`);
      
      const productorEmail = primerMensaje.email_remitente === user?.email
        ? (primerMensaje.email_destinatario || '')
        : (primerMensaje.email_remitente || '');
      
      return {
        userId: Number(userId),
        mensajes: mensajesOrdenados,
        ultimoMensaje: primerMensaje,
        noLeidos: mensajesOrdenados.filter((m: any) => !m.leido && m.id_remitente !== user?.id_usuario).length,
        productorNombre,
        productorEmail,
      };
    });
    
    // Ordenar conversaciones por fecha del último mensaje (más reciente primero)
    conversacionesResult.sort((a, b) => {
      const fechaA = new Date(a.ultimoMensaje.fecha_envio || a.ultimoMensaje.fecha_creacion || 0).getTime();
      const fechaB = new Date(b.ultimoMensaje.fecha_envio || b.ultimoMensaje.fecha_creacion || 0).getTime();
      return fechaB - fechaA;
    });
    
    return conversacionesResult;
  }, [todosLosMensajes, user?.id_usuario, user?.nombre, user?.email]);

  const conversacionActual = conversaciones.find(c => c.userId === selectedConversation);
  
  // Obtener TODA la conversación cuando se selecciona una conversación
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  
  // Usar la conversación completa si está disponible, sino usar la agrupada
  const mensajesConversacion = conversacionCompleta && conversacionCompleta.length > 0 
    ? conversacionCompleta 
    : (conversacionActual?.mensajes || []);
  
  // Scroll solo cuando hay nuevos mensajes (no al seleccionar conversación)
  useEffect(() => {
    if (mensajesConversacion.length > 0 && mensajesConversacion.length > lastMessageCount) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      setLastMessageCount(mensajesConversacion.length);
    }
  }, [mensajesConversacion.length]);

  // Resetear contador cuando cambia la conversación seleccionada
  useEffect(() => {
    setLastMessageCount(0);
  }, [selectedConversation]);

  const isLoading = loadingRecibidos || loadingEnviados;

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
              <h5 className="mb-0">Conversaciones</h5>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="text-muted mt-2">Cargando mensajes...</p>
                </div>
              ) : conversaciones.length === 0 ? (
                <div className="text-center py-5">
                  <BiMessageSquare className="display-4 text-muted mb-3" />
                  <p className="text-muted">No hay conversaciones aún</p>
                  <small className="text-muted d-block mt-2">
                    Puedes contactar productores desde la página de productos
                  </small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {conversaciones.map((conv, index) => (
                    <button
                      key={conv.userId}
                      className={`list-group-item list-group-item-action conversation-item ${
                        selectedConversation === conv.userId ? 'active' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => {
                        setSelectedConversation(conv.userId);
                        setNewMessage({ asunto: '', mensaje: '', id_destinatario: conv.userId, id_producto: undefined });
                        setSelectedProduct(null);
                        // Marcar como leído los mensajes recibidos
                        if (conv.noLeidos > 0) {
                          conv.mensajes.forEach((msg: any) => {
                            if (!msg.leido && msg.id_remitente !== user?.id_usuario) {
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
                            {conv.ultimoMensaje.mensaje || conv.ultimoMensaje.asunto || 'Sin mensaje'}
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
