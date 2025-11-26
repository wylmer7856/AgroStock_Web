import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajesService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiMessageSquare, BiSend, BiCheck, BiUser, BiTime, BiEnvelope, BiPhone } from 'react-icons/bi';
import './MensajesPage.css';

const ProductorMensajesPage: React.FC = React.memo(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState({ asunto: '', mensaje: '', id_destinatario: 0 });
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  // Scroll al final solo cuando hay nuevos mensajes (no al seleccionar conversación)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Obtener mensajes recibidos (de consumidores)
  const { data: mensajesRecibidos, isLoading: loadingRecibidos } = useQuery({
    queryKey: ['mensajes', 'productor', 'recibidos', user?.id_usuario],
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
    queryKey: ['mensajes', 'productor', 'enviados', user?.id_usuario],
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

  // Mutation para enviar mensaje (respuesta a consumidor)
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof newMessage) => {
      const response = await mensajesService.enviarMensaje({
        id_destinatario: data.id_destinatario,
        asunto: data.asunto,
        mensaje: data.mensaje,
        tipo_mensaje: 'general',
      });
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Error al enviar mensaje');
      }
      
      return response.data || response;
    },
    onSuccess: () => {
      toast.success('✅ Mensaje enviado correctamente');
      setNewMessage({ asunto: '', mensaje: '', id_destinatario: selectedConversation || 0 });
      queryClient.invalidateQueries({ 
        queryKey: ['mensajes', 'productor'],
        refetchType: 'none'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['mensajes', 'conversacion'],
        refetchType: 'none'
      });
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
      queryClient.invalidateQueries({ 
        queryKey: ['mensajes', 'productor'],
        refetchType: 'none'
      });
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
                     : 'Consulta');
    
    sendMessageMutation.mutate({
      asunto,
      mensaje: newMessage.mensaje.trim(),
      id_destinatario: selectedConversation,
    });
  };

  // Combinar todos los mensajes (recibidos + enviados)
  const todosLosMensajes = React.useMemo(() => {
    const recibidos = mensajesRecibidos || [];
    const enviados = mensajesEnviados || [];
    return [...recibidos, ...enviados];
  }, [mensajesRecibidos, mensajesEnviados]);

  // Agrupar mensajes por conversación (por consumidor)
  const conversaciones = React.useMemo(() => {
    if (!todosLosMensajes || !Array.isArray(todosLosMensajes) || todosLosMensajes.length === 0) {
      return [];
    }
    
    const grouped: Record<number, any[]> = {};
    todosLosMensajes.forEach((msg: any) => {
      // Identificar el ID del consumidor (remitente o destinatario según corresponda)
      let consumidorId: number | null = null;
      
      if (msg.id_remitente === user?.id_usuario) {
        // Mensaje enviado por el productor: el destinatario es el consumidor
        consumidorId = msg.id_destinatario || msg.id_usuario_destinatario || null;
      } else {
        // Mensaje recibido: el remitente es el consumidor
        consumidorId = msg.id_remitente || msg.id_usuario_remitente || null;
      }
      
      if (!consumidorId || consumidorId === user?.id_usuario) {
        return; // Saltar mensajes sin consumidor o propios
      }
      
      if (!grouped[consumidorId]) {
        grouped[consumidorId] = [];
      }
      grouped[consumidorId].push(msg);
    });

    const conversacionesResult = Object.entries(grouped).map(([userId, msgs]) => {
      // Ordenar mensajes por fecha (más reciente primero)
      const mensajesOrdenados = msgs.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_envio || a.fecha_creacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha_envio || b.fecha_creacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      });
      
      const primerMensaje = mensajesOrdenados[0];
      
      // Obtener información del consumidor
      const consumidorNombre = primerMensaje.nombre_remitente === user?.nombre
        ? (primerMensaje.nombre_destinatario || `Usuario #${userId}`)
        : (primerMensaje.nombre_remitente || `Usuario #${userId}`);
      
      const consumidorEmail = primerMensaje.email_remitente === user?.email
        ? (primerMensaje.email_destinatario || '')
        : (primerMensaje.email_remitente || '');
      
      return {
        userId: Number(userId),
        mensajes: mensajesOrdenados,
        ultimoMensaje: primerMensaje,
        noLeidos: mensajesOrdenados.filter((m: any) => !m.leido && m.id_remitente !== user?.id_usuario).length,
        consumidorNombre,
        consumidorEmail,
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
            Mensajes de Consumidores
          </h1>
          <p className="text-muted">Recibe y responde mensajes de tus clientes</p>
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
                </div>
              ) : conversaciones.length === 0 ? (
                <div className="text-center py-5">
                  <BiMessageSquare className="display-4 text-muted mb-3" />
                  <p className="text-muted">No hay conversaciones aún</p>
                  <small className="text-muted d-block mt-2">
                    Los consumidores pueden contactarte sobre tus productos
                  </small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {conversaciones.map((conv, index) => (
                    <button
                      key={conv.userId}
                      className={`list-group-item list-group-item-action conversation-item-productor ${
                        selectedConversation === conv.userId ? 'active' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => {
                        setSelectedConversation(conv.userId);
                        setNewMessage({ asunto: '', mensaje: '', id_destinatario: conv.userId });
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
                            <strong>{conv.consumidorNombre}</strong>
                            {conv.noLeidos > 0 && (
                              <span className="badge bg-danger">{conv.noLeidos}</span>
                            )}
                          </div>
                          <p className="mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                            {conv.ultimoMensaje.mensaje || conv.ultimoMensaje.asunto || 'Sin mensaje'}
                          </p>
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
                      {conversacionActual.consumidorNombre}
                    </h5>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      {conversacionActual.consumidorEmail && (
                        <span>
                          <BiEnvelope className="me-1" />
                          {conversacionActual.consumidorEmail}
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
                                  {msg.nombre_remitente || 'Consumidor'}
                                </div>
                              )}
                              {msg.asunto && msg.asunto !== 'Sin asunto' && (
                                <div className={`small mb-2 ${esMio ? 'opacity-90' : 'text-muted'}`}>
                                  <strong>{msg.asunto}</strong>
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
                  <div className="input-group">
                    {!conversacionActual?.ultimoMensaje?.asunto || conversacionActual.ultimoMensaje.asunto === 'Sin asunto' ? (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Asunto (opcional)"
                        value={newMessage.asunto}
                        onChange={(e) => setNewMessage({ ...newMessage, asunto: e.target.value })}
                        style={{ maxWidth: '200px' }}
                      />
                    ) : null}
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
                  Los consumidores pueden contactarte sobre tus productos
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductorMensajesPage.displayName = 'ProductorMensajesPage';

export default ProductorMensajesPage;
