/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajesService, productosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BiMessageSquare, 
  BiSend, 
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

  const totalMensajes = mensajes?.length || 0;
  const totalConversaciones = conversaciones.length;
  const mensajesNoLeidos = React.useMemo(() => {
    if (!mensajesRecibidos || !Array.isArray(mensajesRecibidos)) return 0;
    return mensajesRecibidos.filter((m: any) => !m.leido).length;
  }, [mensajesRecibidos]);

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

  const formatMessageDate = (fecha?: string) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getMessagePreview = (texto?: string, maxLength = 80) => {
    if (!texto) return '';
    return texto.length > maxLength ? `${texto.slice(0, maxLength)}...` : texto;
  };

  const enviarMensajeActual = () => {
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

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    enviarMensajeActual();
  };

  return (
    <div className="mensajes-page-wrapper">
      <div className="mensajes-container">
        <div className="mensajes-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h1 className="mensajes-title mb-2">
              <BiMessageSquare className="me-2" />
              Mensajes
            </h1>
            <p className="mensajes-subtitle mb-0">Comunícate con los productores sobre sus productos</p>
          </div>
          <div className="mensajes-header-stats d-flex flex-wrap gap-3">
            <div className="mensajes-stat-card">
              <span>Conversaciones</span>
              <strong>{totalConversaciones}</strong>
            </div>
            <div className="mensajes-stat-card">
              <span>Total mensajes</span>
              <strong>{totalMensajes}</strong>
            </div>
            <div className="mensajes-stat-card">
              <span>Sin leer</span>
              <strong>{mensajesNoLeidos}</strong>
            </div>
          </div>
        </div>

        <div className="row g-4 mensajes-content">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 mensajes-card">
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
                  <div className="mensajes-empty-state text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted mt-3">Cargando tus conversaciones...</p>
                  </div>
                ) : conversaciones.length === 0 ? (
                  <div className="mensajes-empty-state text-center py-5">
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
                    {conversaciones.map((conv) => {
                      const ultimoMensaje = conv.ultimoMensaje;
                      const fechaUltimoMensaje = formatMessageDate(
                        ultimoMensaje?.fecha_envio || ultimoMensaje?.fecha_creacion || ultimoMensaje?.fecha
                      );
                      return (
                        <button
                          key={conv.userId}
                          className={`list-group-item list-group-item-action ${
                            selectedConversation === conv.userId ? 'active' : ''
                          }`}
                          onClick={() => {
                            setSelectedConversation(conv.userId);
                            setNewMessage({ asunto: '', mensaje: '', id_destinatario: conv.userId, id_producto: undefined });
                            setSelectedProduct(null);
                            if (activeTab === 'recibidos' && conv.noLeidos > 0) {
                              conv.mensajes.forEach((msg: any) => {
                                if (!msg.leido && msg.id_remitente === conv.userId) {
                                  markAsReadMutation.mutate(msg.id_mensaje);
                                }
                              });
                            }
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start w-100">
                            <div className="text-start">
                              <div className="fw-semibold">{conv.productorNombre}</div>
                              <div className="text-muted small">
                                {ultimoMensaje?.asunto || 'Sin asunto'}
                              </div>
                              <div className="text-muted small">
                                {getMessagePreview(ultimoMensaje?.mensaje || 'Sin mensajes')}
                              </div>
                            </div>
                            <div className="text-end">
                              <small className="text-muted d-block">{fechaUltimoMensaje}</small>
                              {activeTab === 'recibidos' && conv.noLeidos > 0 && (
                                <span className="badge bg-danger mt-2">{conv.noLeidos}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-8">
            {selectedConversation && conversacionActual ? (
              <div className="card border-0 shadow-sm h-100 mensajes-card">
                <div className="card-header bg-white d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{conversacionActual.productorNombre}</h5>
                    {conversacionActual.productorEmail && (
                      <small className="text-muted">{conversacionActual.productorEmail}</small>
                    )}
                  </div>
                  <span className="badge bg-light text-dark">
                    {activeTab === 'recibidos' ? 'Mensajes recibidos' : 'Mensajes enviados'}
                  </span>
                </div>

                <div className="card-body mensajes-conversacion messages-area" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {mensajesConversacion.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      Aún no hay mensajes en esta conversación
                    </div>
                  ) : (
                    mensajesConversacion.map((msg: any, index: number) => {
                      const esPropio = msg.id_remitente === user?.id_usuario;
                      const fechaMensaje = formatMessageDate(
                        msg.fecha_envio || msg.fecha_creacion || msg.fecha
                      );
                      const remitente = esPropio
                        ? 'Tú'
                        : msg.nombre_remitente || msg.nombre_destinatario || conversacionActual.productorNombre;
                      return (
                        <div
                          key={msg.id_mensaje || `${msg.fecha_envio || msg.fecha_creacion || 'msg'}-${index}`}
                          className={`message-bubble ${esPropio ? 'mine' : 'other'}`}
                        >
                          <div className="message-meta d-flex justify-content-between align-items-center mb-1">
                            <strong className="small">{remitente}</strong>
                            <small className="text-muted">{fechaMensaje}</small>
                          </div>
                          {msg.asunto && msg.asunto !== 'Sin asunto' && (
                            <div className="small text-muted mb-1">{msg.asunto}</div>
                          )}
                          <div className="message-text">{msg.mensaje}</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="card-footer bg-white">
                  <form onSubmit={handleSendMessage}>
                    {!selectedProduct ? (
                      <div className="mb-3">
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
                                      <div className="flex-grow-1 text-start">
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
                      <div className="mb-3">
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
                      <div className="mb-3">
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
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessage.mensaje.trim()) {
                              enviarMensajeActual();
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
              <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center mensajes-card">
                <div className="text-center py-5 mensajes-empty-state">
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
    </div>
  );
};

export default MensajesPage;
