import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajesService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiMessageSquare, BiSend, BiTrash, BiCheck, BiUser, BiTime, BiEnvelope, BiPhone } from 'react-icons/bi';
import './MensajesPage.css';

const ProductorMensajesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'recibidos' | 'enviados'>('recibidos');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState({ asunto: '', mensaje: '', id_destinatario: 0 });
  
  // Scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  // Obtener mensajes recibidos (de consumidores)
  const { data: mensajesRecibidos, isLoading: loadingRecibidos, error: errorRecibidos, refetch: refetchRecibidos } = useQuery({
    queryKey: ['mensajes', 'productor', 'recibidos', user?.id_usuario],
    queryFn: async () => {
      try {
        console.log('🔍 Obteniendo mensajes recibidos para usuario:', user?.id_usuario);
        const response = await mensajesService.obtenerMensajesRecibidos();
        console.log('📨 Respuesta completa mensajes recibidos:', JSON.stringify(response, null, 2));
        
        // El servicio ya normaliza la respuesta
        if (response && response.success !== false && response.data) {
          const mensajes = Array.isArray(response.data) ? response.data : [];
          console.log('✅ Mensajes recibidos procesados:', mensajes.length, mensajes);
          return mensajes;
        }
        
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        return [];
      } catch (error: any) {
        console.error('❌ Error en query mensajes recibidos:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        // No mostrar toast para errores 405, solo log
        if (!error?.message?.includes('405') && !error?.message?.includes('Method Not Allowed')) {
          toast.error('Error al cargar mensajes recibidos');
        }
        return [];
      }
    },
    enabled: !!user?.id_usuario,
    retry: 1,
    refetchInterval: 5000, // refrescar cada 5s
  });

  // Obtener mensajes enviados
  const { data: mensajesEnviados, isLoading: loadingEnviados, error: errorEnviados, refetch: refetchEnviados } = useQuery({
    queryKey: ['mensajes', 'productor', 'enviados', user?.id_usuario],
    queryFn: async () => {
      try {
        console.log('🔍 Obteniendo mensajes enviados para usuario:', user?.id_usuario);
        const response = await mensajesService.obtenerMensajesEnviados();
        console.log('📤 Respuesta completa mensajes enviados:', JSON.stringify(response, null, 2));
        
        // El servicio ya normaliza la respuesta
        if (response && response.success !== false && response.data) {
          const mensajes = Array.isArray(response.data) ? response.data : [];
          console.log('✅ Mensajes enviados procesados:', mensajes.length, mensajes);
          return mensajes;
        }
        
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        return [];
      } catch (error: any) {
        console.error('❌ Error en query mensajes enviados:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        // No mostrar toast para errores 405, solo log
        if (!error?.message?.includes('405') && !error?.message?.includes('Method Not Allowed')) {
          toast.error('Error al cargar mensajes enviados');
        }
        return [];
      }
    },
    enabled: !!user?.id_usuario,
    retry: 1,
    refetchInterval: 5000, // refrescar cada 5s
  });

  // Mutation para enviar mensaje (respuesta a consumidor)
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof newMessage) => {
      console.log('🔄 [sendMessageMutation] mutationFn iniciada con datos:', data);
      
      try {
        const response = await mensajesService.enviarMensaje({
          id_destinatario: data.id_destinatario,
          asunto: data.asunto,
          mensaje: data.mensaje,
          tipo_mensaje: 'general',
        });
        
        console.log('📥 [sendMessageMutation] Respuesta del servicio:', {
          success: response.success,
          message: response.message,
          hasData: !!response.data,
          fullResponse: response
        });
        
        if (!response.success) {
          console.error('❌ [sendMessageMutation] Respuesta sin éxito:', response);
          throw new Error(response.message || response.error || 'Error al enviar mensaje');
        }
        
        console.log('✅ [sendMessageMutation] Mensaje enviado exitosamente');
        return response.data || response;
      } catch (error: any) {
        console.error('❌ [sendMessageMutation] Error en mutationFn:', error);
        console.error('   Error completo:', JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ [sendMessageMutation] onSuccess ejecutado con data:', data);
      toast.success('✅ Mensaje enviado y guardado en la base de datos');
      // Limpiar solo el mensaje, mantener el destinatario
      setNewMessage({ asunto: '', mensaje: '', id_destinatario: selectedConversation || 0 });
      // Invalidar todas las queries relacionadas para actualizar la vista
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'productor'] });
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'productor', 'recibidos'] });
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'productor', 'enviados'] });
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'conversacion'] });
      // Recargar la conversación completa inmediatamente
      if (selectedConversation) {
        setTimeout(() => {
          refetchConversacion();
          refetchRecibidos();
          refetchEnviados();
        }, 500);
      }
      // Scroll al final después de enviar
      setTimeout(scrollToBottom, 300);
    },
    onError: (error: Error) => {
      console.error('❌ [sendMessageMutation] onError ejecutado:', error);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      toast.error(error.message || 'Error al enviar mensaje. Revisa la consola para más detalles.');
    },
  });

  // Mutation para marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: async (id_mensaje: number) => {
      return await mensajesService.marcarComoLeido(id_mensaje);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'productor'] });
    },
  });

  // Mutation para eliminar mensaje
  const deleteMessageMutation = useMutation({
    mutationFn: async (id_mensaje: number) => {
      return await mensajesService.eliminarMensaje(id_mensaje);
    },
    onSuccess: () => {
      toast.success('Mensaje eliminado');
      queryClient.invalidateQueries({ queryKey: ['mensajes', 'productor'] });
    },
    onError: () => {
      toast.error('Error al eliminar mensaje');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 [handleSendMessage] Iniciando envío de mensaje');
    
    if (!selectedConversation) {
      console.error('❌ [handleSendMessage] No hay conversación seleccionada');
      toast.error('Selecciona una conversación para enviar un mensaje');
      return;
    }
    if (!newMessage.mensaje || !newMessage.mensaje.trim()) {
      console.error('❌ [handleSendMessage] Mensaje vacío');
      toast.error('Por favor escribe un mensaje');
      return;
    }
    // Si no hay asunto, usar uno por defecto o el del último mensaje
    const asunto = newMessage.asunto.trim() || 
                   (conversacionActual?.ultimoMensaje?.asunto && conversacionActual.ultimoMensaje.asunto !== 'Sin asunto'
                     ? `Re: ${conversacionActual.ultimoMensaje.asunto}`
                     : 'Consulta');
    
    const mensajeData = {
      asunto,
      mensaje: newMessage.mensaje.trim(),
      id_destinatario: selectedConversation,
    };
    
    console.log('📤 [handleSendMessage] Datos a enviar:', mensajeData);
    console.log('👤 [handleSendMessage] Usuario actual:', user);
    
    sendMessageMutation.mutate(mensajeData);
  };

  const mensajes = activeTab === 'recibidos' ? (mensajesRecibidos || []) : (mensajesEnviados || []);
  const isLoading = activeTab === 'recibidos' ? loadingRecibidos : loadingEnviados;
  
  console.log('📊 Estado actual:', {
    activeTab,
    mensajesRecibidos: mensajesRecibidos?.length || 0,
    mensajesEnviados: mensajesEnviados?.length || 0,
    mensajes: mensajes?.length || 0,
    isLoading,
    errorRecibidos,
    errorEnviados,
    userId: user?.id_usuario,
    mensajesRaw: activeTab === 'recibidos' ? mensajesRecibidos : mensajesEnviados
  });

  // Agrupar mensajes por conversación (por consumidor)
  const conversaciones = React.useMemo(() => {
    if (!mensajes || !Array.isArray(mensajes) || mensajes.length === 0) {
      console.log('📭 No hay mensajes para agrupar', { activeTab, mensajesLength: mensajes?.length || 0 });
      return [];
    }
    
    console.log('📬 Agrupando mensajes:', {
      activeTab,
      totalMensajes: mensajes.length,
      primerMensaje: mensajes[0],
      userId: user?.id_usuario
    });
    
    const grouped: Record<number, any[]> = {};
    mensajes.forEach((msg: any, index: number) => {
      // Para recibidos: agrupar por remitente (consumidor que envió)
      // Para enviados: agrupar por destinatario (consumidor que recibió)
      let consumidorId: number | null = null;
      
      if (activeTab === 'recibidos') {
        // Mensajes recibidos: el remitente es el consumidor
        consumidorId = msg.id_remitente || msg.id_usuario_remitente || null;
      } else {
        // Mensajes enviados: el destinatario es el consumidor
        consumidorId = msg.id_destinatario || msg.id_usuario_destinatario || null;
      }
      
      console.log(`📨 Mensaje ${index + 1}:`, {
        id_mensaje: msg.id_mensaje,
        id_remitente: msg.id_remitente,
        id_destinatario: msg.id_destinatario,
        consumidorId,
        userId: user?.id_usuario,
        activeTab
      });
      
      // Validar que tenemos un ID válido
      if (!consumidorId) {
        console.warn(`⚠️ Mensaje ${index + 1} sin consumidorId, saltando`, msg);
        return;
      }
      
      // Para mensajes enviados, el remitente es el usuario actual, así que no debemos filtrarlo
      // Solo validar que el destinatario (consumidor) sea diferente
      if (activeTab === 'enviados') {
        // En mensajes enviados, el remitente es el usuario actual (productor)
        // El destinatario es el consumidor, así que está bien
        if (msg.id_remitente === user?.id_usuario && consumidorId !== user?.id_usuario) {
          // Es un mensaje válido enviado por el productor a un consumidor
        } else if (consumidorId === user?.id_usuario) {
          console.warn(`⚠️ Mensaje ${index + 1} tiene el mismo usuario como destinatario, saltando`);
          return;
        }
      } else {
        // Para mensajes recibidos, el destinatario es el usuario actual
        // El remitente es el consumidor, así que está bien
        if (consumidorId === user?.id_usuario) {
          console.warn(`⚠️ Mensaje ${index + 1} es del mismo usuario, saltando`);
          return;
        }
      }
      
      if (!grouped[consumidorId]) {
        grouped[consumidorId] = [];
      }
      grouped[consumidorId].push(msg);
    });

    console.log('📊 Mensajes agrupados por consumidor:', Object.keys(grouped).length, Object.keys(grouped));

    const conversacionesResult = Object.entries(grouped).map(([userId, msgs]) => {
      // Ordenar mensajes por fecha (más reciente primero)
      const mensajesOrdenados = msgs.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha_envio || a.fecha_creacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha_envio || b.fecha_creacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      });
      
      const primerMensaje = mensajesOrdenados[0];
      
      // Obtener información del consumidor desde campos directos del mensaje
      const consumidorNombre = activeTab === 'recibidos'
        ? (primerMensaje.nombre_remitente || `Usuario #${userId}`)
        : (primerMensaje.nombre_destinatario || `Usuario #${userId}`);
      
      const consumidorEmail = activeTab === 'recibidos'
        ? (primerMensaje.email_remitente || '')
        : (primerMensaje.email_destinatario || '');
      
      const consumidorTelefono = ''; // No disponible en el modelo actual
      
      return {
        userId: Number(userId),
        mensajes: mensajesOrdenados,
        ultimoMensaje: primerMensaje,
        noLeidos: mensajesOrdenados.filter((m: any) => !m.leido && activeTab === 'recibidos').length,
        consumidorNombre,
        consumidorEmail,
        consumidorTelefono,
      };
    });
    
    console.log('✅ Conversaciones agrupadas:', {
      total: conversacionesResult.length,
      conversaciones: conversacionesResult.map(c => ({
        userId: c.userId,
        nombre: c.consumidorNombre,
        mensajes: c.mensajes.length
      }))
    });
    return conversacionesResult;
  }, [mensajes, activeTab, user?.id_usuario]);

  const conversacionActual = conversaciones.find(c => c.userId === selectedConversation);
  
  // Obtener TODA la conversación (recibidos + enviados) cuando se selecciona una conversación
  const { data: conversacionCompleta, refetch: refetchConversacion } = useQuery({
    queryKey: ['mensajes', 'conversacion', user?.id_usuario, selectedConversation],
    queryFn: async () => {
      if (!selectedConversation || !user?.id_usuario) return [];
      try {
        const response = await mensajesService.obtenerConversacion(selectedConversation);
        console.log('💬 Conversación completa:', response);
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
              ) : (errorRecibidos || errorEnviados) && !errorRecibidos?.message?.includes('405') && !errorEnviados?.message?.includes('405') ? (
                <div className="text-center py-5">
                  <BiMessageSquare className="display-4 text-danger mb-3" />
                  <p className="text-danger">Error al cargar mensajes</p>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => {
                      refetchRecibidos();
                      refetchEnviados();
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              ) : conversaciones.length === 0 ? (
                <div className="text-center py-5">
                  <BiMessageSquare className="display-4 text-muted mb-3" />
                  <p className="text-muted">
                    {activeTab === 'recibidos' 
                      ? 'No hay mensajes recibidos de consumidores' 
                      : 'No has enviado mensajes a consumidores'}
                  </p>
                  <small className="text-muted d-block mt-2">
                    {activeTab === 'recibidos'
                      ? 'Los mensajes se cargan desde la base de datos'
                      : 'Cuando envíes mensajes a consumidores, aparecerán aquí'}
                  </small>
                  {mensajes && mensajes.length > 0 && (
                    <div className="mt-3">
                      <small className="text-warning d-block">
                        ⚠️ Se encontraron {mensajes.length} mensaje(s) pero no se pudieron agrupar
                      </small>
                      <button 
                        className="btn btn-sm btn-outline-primary mt-2"
                        onClick={() => {
                          console.log('📋 Mensajes sin agrupar:', mensajes);
                          console.log('👤 Usuario actual:', user);
                        }}
                      >
                        Ver detalles en consola
                      </button>
                    </div>
                  )}
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
                        setNewMessage({ asunto: '', mensaje: '', id_destinatario: conv.userId });
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
                            <strong>{conv.consumidorNombre}</strong>
                            {conv.noLeidos > 0 && (
                              <span className="badge bg-danger">{conv.noLeidos}</span>
                            )}
                          </div>
                          <p className="mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                            {conv.ultimoMensaje.asunto || 'Sin asunto'}
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
                      {conversacionActual.consumidorTelefono && (
                        <span>
                          <BiPhone className="me-1" />
                          {conversacionActual.consumidorTelefono}
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
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'%23d4d4d4\' stroke-width=\'0.5\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\' /%3E%3C/svg%3E")'
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
};

export default ProductorMensajesPage;

