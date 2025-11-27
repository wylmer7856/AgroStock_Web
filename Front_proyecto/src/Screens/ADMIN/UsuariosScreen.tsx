// 👥 GESTIÓN DE USUARIOS - ADMIN - CON REACT QUERY PARA EVITAR RECARGAS

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import ubicacionesService from '../../services/ubicaciones';
import imagenesService from '../../services/imagenes';
import { Card, Button, Input, Modal, Loading, Badge } from '../../components/ReusableComponents';
import type { UsuarioAdmin, Ciudad } from '../../types';
import Swal from 'sweetalert2';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './AdminScreens.css';

interface UsuariosScreenProps {
  onNavigate: (view: string) => void;
}

// Funciones helper
const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return 'N/A';
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
};

const formatearTelefono = (telefono: string | null | undefined): string => {
  if (!telefono) return 'N/A';
  const numero = telefono.replace(/\D/g, '');
  if (numero.length === 10) {
    return `${numero.substring(0, 3)} ${numero.substring(3, 6)} ${numero.substring(6)}`;
  } else if (numero.length === 12 && numero.startsWith('57')) {
    return `+57 ${numero.substring(2, 5)} ${numero.substring(5, 8)} ${numero.substring(8)}`;
  }
  return telefono;
};

export const UsuariosScreen: React.FC<UsuariosScreenProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 300);

  // Query para cargar usuarios - React Query maneja el cache y actualizaciones
  const { data: usuarios = [], isLoading: loading, error } = useQuery({
    queryKey: ['admin', 'usuarios', filtroRol, filtroEstado],
    queryFn: async () => {
      const filtros: any = {};
      if (filtroRol !== 'todos') filtros.rol = filtroRol;
      if (filtroEstado !== 'todos') {
        // Enviar como string 'true' o 'false' para que el backend lo maneje correctamente
        filtros.activo = filtroEstado === 'activos' ? 'true' : 'false';
        console.log('🔍 [UsuariosScreen] Aplicando filtro de estado:', filtroEstado, '-> activo:', filtros.activo);
      }
      
      console.log('🔍 [UsuariosScreen] Filtros enviados al backend:', filtros);
      const response = await adminService.getUsuarios(filtros);
      console.log('🔍 [UsuariosScreen] Usuarios recibidos del backend:', response.data?.length || 0);
      
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error cargando usuarios');
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch cuando se monta para asegurar datos actualizados
    refetchOnReconnect: false,
    staleTime: 0, // Los datos se consideran obsoletos inmediatamente para que se actualicen con los filtros
  });

  // Filtrar usuarios por búsqueda (filtrado en cliente para mejor UX)
  // NOTA: Los usuarios ya vienen filtrados por rol y estado desde el backend
  const usuariosFiltrados = useMemo(() => {
    console.log('🔍 [UsuariosScreen] usuariosFiltrados - usuarios recibidos:', usuarios.length);
    console.log('🔍 [UsuariosScreen] usuariosFiltrados - filtroEstado:', filtroEstado);
    console.log('🔍 [UsuariosScreen] usuariosFiltrados - busquedaDebounced:', busquedaDebounced);
    
    // Los usuarios ya vienen filtrados por rol y estado del backend
    // Solo aplicamos el filtro de búsqueda aquí
    let resultado = usuarios;
    
    // Aplicar filtro de búsqueda si hay texto
    if (busquedaDebounced) {
      const busquedaLower = busquedaDebounced.toLowerCase().trim();
      resultado = resultado.filter(usuario => {
        const nombreMatch = usuario.nombre?.toLowerCase().includes(busquedaLower);
        const emailMatch = usuario.email?.toLowerCase().includes(busquedaLower);
        const telefonoMatch = usuario.telefono?.includes(busquedaDebounced);
        const idMatch = usuario.id_usuario?.toString().includes(busquedaDebounced);
        return nombreMatch || emailMatch || telefonoMatch || idMatch;
      });
    }
    
    // Verificar que los usuarios tengan el estado correcto (doble verificación en frontend)
    if (filtroEstado !== 'todos') {
      const estadoEsperado = filtroEstado === 'activos';
      const antes = resultado.length;
      resultado = resultado.filter(usuario => {
        const usuarioActivo = Boolean(usuario.activo);
        return usuarioActivo === estadoEsperado;
      });
      if (antes !== resultado.length) {
        console.warn(`⚠️ [UsuariosScreen] Se filtraron ${antes - resultado.length} usuarios que no coincidían con el estado esperado`);
      }
    }
    
    console.log('🔍 [UsuariosScreen] usuariosFiltrados - resultado final:', resultado.length);
    return resultado;
  }, [usuarios, busquedaDebounced, filtroEstado]);

  // Mutation para activar/desactivar usuario - solo actualiza la query específica
  const toggleUsuarioMutation = useMutation({
    mutationFn: async ({ usuario, nuevoEstado }: { usuario: UsuarioAdmin; nuevoEstado: boolean }) => {
      const usuarioActual = usuarios.find(u => u.id_usuario === usuario.id_usuario);
      if (!usuarioActual) {
        throw new Error('Usuario no encontrado');
      }

      const response = await adminService.editarUsuario(usuario.id_usuario, {
        nombre: usuarioActual.nombre,
        email: usuarioActual.email,
        telefono: usuarioActual.telefono || '',
        direccion: usuarioActual.direccion || '',
        id_ciudad: usuarioActual.id_ciudad || undefined,
        rol: usuarioActual.rol,
        activo: nuevoEstado
      });

      if (!response.success) {
        throw new Error(response.message || response.error || 'Error cambiando estado del usuario');
      }

      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidar todas las queries de usuarios (incluyendo las filtradas) - esto actualiza las tablas sin recargar la página
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      // También invalidar estadísticas si es necesario
      queryClient.invalidateQueries({ queryKey: ['admin', 'estadisticas'] });
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: `Usuario ${variables.nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    },
    onError: (err: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.message || 'Error cambiando estado del usuario',
        confirmButtonColor: '#2d5016'
      });
    }
  });

  const handleDesactivar = async (usuario: UsuarioAdmin) => {
    const nuevoEstado = !usuario.activo;
    toggleUsuarioMutation.mutate({ usuario, nuevoEstado });
  };

  // Mutation para eliminar usuario - solo actualiza la query específica
  const eliminarUsuarioMutation = useMutation({
    mutationFn: async (usuario: UsuarioAdmin) => {
      const response = await adminService.eliminarUsuario(usuario.id_usuario);
      if (!response.success) {
        throw new Error(response.message || response.error || 'Error eliminando usuario');
      }
      return { response, usuario };
    },
    onSuccess: (data) => {
      // Invalidar solo las queries de usuarios - esto actualiza las tablas sin recargar la página
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'estadisticas'] });
      
      // Mostrar mensaje de éxito con detalles
      const { response, usuario } = data;
      let detallesHTML = '<div style="text-align: left; margin-top: 1rem;">';
      if (response.detalles) {
        const detalles = response.detalles;
        const items: Array<{ label: string; value: number }> = [];
        
        if (detalles.productos > 0) items.push({ label: 'Productos', value: detalles.productos });
        if (detalles.historial_precios > 0) items.push({ label: 'Registros de historial de precios', value: detalles.historial_precios });
        if (detalles.alertas > 0) items.push({ label: 'Alertas de stock', value: detalles.alertas });
        
        const totalPedidos = (detalles.pedidos_consumidor || 0) + (detalles.pedidos_productor || 0);
        if (totalPedidos > 0) {
          items.push({ label: 'Pedidos', value: totalPedidos });
          if (detalles.detalle_pedidos > 0) items.push({ label: 'Detalles de pedidos', value: detalles.detalle_pedidos });
        }
        
        const totalMensajes = (detalles.mensajes_remitente || 0) + (detalles.mensajes_destinatario || 0);
        if (totalMensajes > 0) items.push({ label: 'Mensajes', value: totalMensajes });
        
        if (detalles.carrito > 0) items.push({ label: 'Items del carrito', value: detalles.carrito });
        if (detalles.lista_deseos > 0) items.push({ label: 'Items de lista de deseos', value: detalles.lista_deseos });
        if (detalles.notificaciones > 0) items.push({ label: 'Notificaciones', value: detalles.notificaciones });
        
        const totalReseñas = (detalles.reseñas_consumidor || 0) + (detalles.reseñas_productor || 0);
        if (totalReseñas > 0) items.push({ label: 'Reseñas', value: totalReseñas });
        
        if (detalles.estadisticas > 0) items.push({ label: 'Registros de estadísticas', value: detalles.estadisticas });
        
        if (items.length > 0) {
          detallesHTML += '<p style="font-weight: 600; margin-bottom: 0.5rem; color: #059669;">✅ También se eliminaron:</p>';
          detallesHTML += '<ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">';
          items.forEach(item => {
            detallesHTML += `<li><strong>${item.value}</strong> ${item.label}</li>`;
          });
          detallesHTML += '</ul>';
        }
      }
      detallesHTML += '</div>';

      Swal.fire({
        icon: 'success',
        title: '¡Usuario eliminado!',
        html: `
          <div style="text-align: left;">
            <p style="font-size: 1.1rem; margin-bottom: 1rem;">El usuario <strong>${usuario.nombre}</strong> ha sido eliminado exitosamente.</p>
            <p style="color: #059669; font-weight: 600; margin-bottom: 0.5rem;">✅ Se eliminaron todos los registros relacionados en todas las tablas de la base de datos.</p>
            ${detallesHTML}
          </div>
        `,
        confirmButtonColor: '#2d5016',
        confirmButtonText: 'Entendido',
        width: '600px'
      });
    },
    onError: (err: any) => {
      let mensajeError = 'Error eliminando usuario';
      if (err?.response?.data?.message) {
        mensajeError = err.response.data.message;
      } else if (err?.message) {
        mensajeError = err.message;
      }
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensajeError,
        confirmButtonColor: '#2d5016'
      });
    }
  });

  const handleEliminar = async (usuario: UsuarioAdmin) => {
    // Primero verificar si el usuario tiene registros relacionados
    try {
      Swal.fire({
        title: 'Verificando...',
        text: 'Verificando registros relacionados del usuario',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const verificacion = await adminService.verificarRegistrosUsuario(usuario.id_usuario);
      
      if (verificacion.success && verificacion.data?.tieneRegistros) {
        const detalles = verificacion.data.detalles || {};
        const totalRegistros = verificacion.data.totalRegistros || 0;
        const tablas = Object.keys(detalles);
        
        let detallesHTML = '<div style="text-align: left; margin-top: 1rem;">';
        detallesHTML += '<p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Este usuario tiene registros relacionados:</p>';
        detallesHTML += '<ul style="margin: 0; padding-left: 1.5rem; color: #6b7280;">';
        tablas.forEach(tabla => {
          const nombreTabla = tabla === 'productos' ? 'Productos' :
                             tabla === 'pedidos' ? 'Pedidos' :
                             tabla === 'mensajes' ? 'Mensajes' :
                             tabla === 'carrito' ? 'Items en carrito' :
                             tabla === 'lista_deseos' ? 'Items en lista de deseos' :
                             tabla === 'reseñas' ? 'Reseñas' :
                             tabla === 'notificaciones' ? 'Notificaciones' : tabla;
          detallesHTML += `<li><strong>${detalles[tabla]}</strong> ${nombreTabla}</li>`;
        });
        detallesHTML += '</ul>';
        detallesHTML += '<p style="color: #dc2626; font-weight: 600; margin-top: 1rem;">No se puede eliminar este usuario mientras tenga registros relacionados.</p>';
        detallesHTML += '</div>';

        Swal.fire({
          icon: 'error',
          title: 'No se puede eliminar',
          html: `
            <div style="text-align: left;">
              <p style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">El usuario <strong>${usuario.nombre}</strong> tiene <strong>${totalRegistros}</strong> registro(s) relacionado(s) en <strong>${tablas.length}</strong> tabla(s).</p>
              ${detallesHTML}
            </div>
          `,
          confirmButtonColor: '#2d5016',
          confirmButtonText: 'Entendido',
          width: '600px'
        });
        return;
      }
    } catch (error: any) {
      console.error('Error verificando registros:', error);
      // Si hay error en la verificación, continuar con el proceso normal
    }

    // Si no tiene registros o hubo error en la verificación, proceder con la eliminación
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">¿Eliminar al usuario <strong>${usuario.nombre}</strong>?</p>
          <p style="color: #dc2626; margin-bottom: 0.5rem;">⚠️ Esta acción no se puede deshacer.</p>
          <p style="color: #6b7280; font-size: 0.9rem;">Se eliminarán todos los datos relacionados:</p>
          <ul style="color: #6b7280; font-size: 0.85rem; margin-top: 0.5rem; padding-left: 1.5rem;">
            <li>Productos y sus imágenes</li>
            <li>Pedidos y detalles de pedidos</li>
            <li>Mensajes y notificaciones</li>
            <li>Carrito y lista de deseos</li>
            <li>Reseñas y estadísticas</li>
          </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    });

    if (!result.isConfirmed) return;

    // Mostrar loading
    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera mientras se elimina el usuario y todos sus datos',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Ejecutar la mutation - esto actualizará solo las queries necesarias sin recargar la página
    eliminarUsuarioMutation.mutate(usuario);
  };

  const getRolBadge = (rol: string) => {
    const roles: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', icon: string }> = {
      'admin': { variant: 'error', icon: '👨‍💼' },
      'productor': { variant: 'warning', icon: '🌱' },
      'consumidor': { variant: 'info', icon: '🛒' }
    };
    return roles[rol] || { variant: 'info' as const, icon: '👤' };
  };

  // Estadísticas para gráficas
  const estadisticas = useMemo(() => {
    const total = usuariosFiltrados.length;
    const activos = usuariosFiltrados.filter(u => u.activo).length;
    const inactivos = total - activos;
    
    const porRol = usuariosFiltrados.reduce((acc, usuario) => {
      const rol = usuario.rol || 'consumidor';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const datosRol = [
      { name: 'Admin', value: porRol.admin || 0, color: '#dc3545' },
      { name: 'Productor', value: porRol.productor || 0, color: '#ffc107' },
      { name: 'Consumidor', value: porRol.consumidor || 0, color: '#17a2b8' }
    ];

    const datosEstado = [
      { name: 'Activos', value: activos, color: '#28a745' },
      { name: 'Inactivos', value: inactivos, color: '#dc3545' }
    ];

    const datosBarra = [
      { name: 'Admin', cantidad: porRol.admin || 0 },
      { name: 'Productor', cantidad: porRol.productor || 0 },
      { name: 'Consumidor', cantidad: porRol.consumidor || 0 }
    ];

    return {
      total,
      activos,
      inactivos,
      datosRol,
      datosEstado,
      datosBarra
    };
  }, [usuariosFiltrados]);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-people-fill me-2"></i>
            Gestión de Usuarios
          </h1>
          <p>Administra todos los usuarios del sistema</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="primary" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Botón Nuevo Usuario clickeado, showCreateModal actual:', showCreateModal);
              setShowCreateModal(true);
              console.log('showCreateModal después de setState:', true);
              // Forzar re-render
              setTimeout(() => {
                console.log('Estado después de timeout:', showCreateModal);
              }, 100);
            }}
            className="btn-nuevo-usuario"
            type="button"
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <Card className="usuarios-filters-card">
        <div className="usuarios-filters-container">
          <div className="usuarios-search-wrapper">
            <div className="search-icon-wrapper">
              <i className="bi bi-search"></i>
            </div>
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="usuarios-search-input"
            />
            {busqueda && (
              <button 
                className="clear-search-btn"
                onClick={() => setBusqueda('')}
                title="Limpiar búsqueda"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}
          </div>
          <div className="usuarios-filters-row">
            <div className="usuarios-filter-item">
              <label className="usuarios-filter-label">
                <i className="bi bi-person-badge"></i>
                Rol
              </label>
              <select 
                value={filtroRol} 
                onChange={(e) => setFiltroRol(e.target.value)}
                className="usuarios-filter-select"
              >
              <option value="todos">Todos los roles</option>
                <option value="admin">👨‍💼 Admin</option>
                <option value="productor">🌱 Productor</option>
                <option value="consumidor">🛒 Consumidor</option>
            </select>
          </div>
            <div className="usuarios-filter-item">
              <label className="usuarios-filter-label">
                <i className="bi bi-toggle-on"></i>
                Estado
              </label>
              <select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="usuarios-filter-select"
              >
              <option value="todos">Todos</option>
                <option value="activos">✅ Activos</option>
                <option value="inactivos">❌ Inactivos</option>
            </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de usuarios */}
      <Card title={`Usuarios (${usuariosFiltrados.length})`}>
        {loading ? (
          <Loading text="Cargando usuarios..." />
        ) : error ? (
          <div className="error-message">
            <p>{error instanceof Error ? error.message : 'Error cargando usuarios'}</p>
            <Button variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })}>Reintentar</Button>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="usuarios-table-wrapper">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th className="th-avatar">Foto</th>
                  <th className="th-nombre">Nombre</th>
                  <th className="th-email">Email</th>
                  <th className="th-telefono">Teléfono</th>
                  <th className="th-rol">Rol</th>
                  <th className="th-ubicacion">Ubicación</th>
                  <th className="th-estado">Estado</th>
                  <th className="th-registro">Registro</th>
                  <th className="th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const rolInfo = getRolBadge(usuario.rol || 'consumidor');
                  const iniciales = usuario.nombre
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2) || 'U';
                  const fotoUrl = usuario.foto_perfil ? imagenesService.construirUrlImagen(usuario.foto_perfil) : null;
                  
                  return (
                    <tr key={usuario.id_usuario} className="usuarios-table-row">
                      <td className="td-avatar">
                        <div className="usuario-avatar-cell">
                          {fotoUrl ? (
                            <img
                              src={fotoUrl}
                              alt={usuario.nombre || 'Usuario'}
                              className="usuario-avatar-img"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="usuario-avatar-iniciales">${iniciales}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="usuario-avatar-iniciales">{iniciales}</span>
                          )}
                        </div>
                      </td>
                      <td className="td-nombre">
                        <div className="usuario-nombre-cell">
                          <strong className="usuario-nombre-text">{usuario.nombre}</strong>
                          <small className="usuario-id-text">ID: {usuario.id_usuario}</small>
                        </div>
                      </td>
                      <td className="td-email">
                        <div className="usuario-email-cell">
                          <span className="usuario-email-text">{usuario.email || 'N/A'}</span>
                          {usuario.email_verificado && (
                            <Badge variant="success" size="small" className="verificado-badge">✓</Badge>
                          )}
                        </div>
                      </td>
                      <td className="td-telefono">
                        <div className="usuario-telefono-cell">
                          <span className="usuario-telefono-text">{formatearTelefono(usuario.telefono)}</span>
                          {usuario.telefono_verificado && (
                            <Badge variant="success" size="small" className="verificado-badge">✓</Badge>
                          )}
                        </div>
                      </td>
                      <td className="td-rol">
                        <Badge variant={rolInfo.variant} size="small" className="rol-badge">
                          {rolInfo.icon} {usuario.rol}
                        </Badge>
                      </td>
                      <td className="td-ubicacion">
                        {usuario.ubicacion ? (
                          <span className="usuario-ubicacion-text">
                            {usuario.ubicacion.ciudad}, {usuario.ubicacion.departamento}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="td-estado">
                        <Badge 
                          variant={usuario.activo ? 'success' : 'error'} 
                          size="small"
                          className={`estado-badge ${usuario.activo ? 'estado-activo' : 'estado-inactivo'}`}
                        >
                          {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
                        </Badge>
                      </td>
                      <td className="td-registro">
                        <span className="usuario-fecha-text">{formatearFecha(usuario.fecha_registro)}</span>
                      </td>
                      <td className="td-acciones">
                        <div className="usuarios-acciones-buttons">
                          <Button
                            size="small"
                            variant={usuario.activo ? 'warning' : 'success'}
                            onClick={() => handleDesactivar(usuario)}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                            className={usuario.activo ? 'btn-accion-toggle btn-warning' : 'btn-accion-toggle btn-success'}
                          >
                            {usuario.activo ? (
                              <i className="bi bi-pause-fill"></i>
                            ) : (
                              <i className="bi bi-play-fill"></i>
                            )}
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            onClick={() => handleEliminar(usuario)}
                            title="Eliminar"
                            className="btn-accion-delete"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Paginación */}
      {usuariosFiltrados.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando 1 - {usuariosFiltrados.length} de {usuariosFiltrados.length} usuarios
          </div>
        </div>
      )}

      {/* Gráficas Estadísticas */}
      {usuariosFiltrados.length > 0 && (
        <div className="usuarios-graficas-container">
          <div className="graficas-grid">
            {/* Gráfica de Barras - Usuarios por Rol */}
            <Card className="grafica-card">
              <div className="grafica-header">
                <h3>
                  <i className="bi bi-bar-chart-fill me-2"></i>
                  Usuarios por Rol
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.datosBarra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Gráfica de Pie - Distribución por Rol */}
            <Card className="grafica-card">
              <div className="grafica-header">
                <h3>
                  <i className="bi bi-pie-chart-fill me-2"></i>
                  Distribución por Rol
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadisticas.datosRol}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadisticas.datosRol.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Gráfica de Pie - Estado de Usuarios */}
            <Card className="grafica-card">
              <div className="grafica-header">
                <h3>
                  <i className="bi bi-pie-chart-fill me-2"></i>
                  Estado de Usuarios
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadisticas.datosEstado}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadisticas.datosEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Tarjetas de Resumen - Ocupa todo el ancho */}
            <Card className="grafica-card estadisticas-resumen-full">
              <div className="grafica-header">
                <h3>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Resumen Estadístico
                </h3>
              </div>
              <div className="resumen-stats">
                <div className="stat-item">
                  <div className="stat-icon total">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{estadisticas.total}</div>
                    <div className="stat-label">Total Usuarios</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon activos">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{estadisticas.activos}</div>
                    <div className="stat-label">Usuarios Activos</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon inactivos">
                    <i className="bi bi-x-circle-fill"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{estadisticas.inactivos}</div>
                    <div className="stat-label">Usuarios Inactivos</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon porcentaje">
                    <i className="bi bi-percent"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {estadisticas.total > 0 
                        ? ((estadisticas.activos / estadisticas.total) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="stat-label">Tasa de Activos</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Crear Usuario */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('[UsuariosScreen] Cerrando modal desde onClose');
          setShowCreateModal(false);
        }}
        onSuccess={() => {
          console.log('[UsuariosScreen] Usuario creado exitosamente');
          setShowCreateModal(false);
          // Invalidar solo las queries de usuarios - esto actualiza las tablas sin recargar la página
          queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'estadisticas'] });
          Swal.fire({
            icon: 'success',
            title: '¡Usuario creado!',
            text: 'El usuario ha sido creado exitosamente',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }}
      />
    </div>
  );
};

// ===== MODAL PARA CREAR USUARIO =====
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    id_ciudad: '',
    rol: 'consumidor' as 'admin' | 'consumidor' | 'productor'
  });
  const [loading, setLoading] = useState(false);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  useEffect(() => {
    console.log('[CreateUserModal] isOpen cambió a:', isOpen);
    if (isOpen) {
      console.log('[CreateUserModal] Modal abierto, cargando ciudades...');
      cargarCiudades();
    } else {
      console.log('[CreateUserModal] Modal cerrado, limpiando formulario...');
      // Limpiar formulario cuando se cierra
      setFormData({
        nombre: '',
        email: '',
        password: '',
        telefono: '',
        direccion: '',
        id_ciudad: '',
        rol: 'consumidor'
      });
    }
  }, [isOpen]);
  
  // Log adicional para verificar el render
  useEffect(() => {
    if (isOpen) {
      console.log('[CreateUserModal] Modal debería estar visible ahora');
    }
  }, [isOpen]);

  const cargarCiudades = async () => {
    try {
      setLoadingCiudades(true);
      const response = await ubicacionesService.listarCiudades();
      if (response.success && response.data) {
        setCiudades(response.data);
      }
    } catch (err) {
      console.error('Error cargando ciudades:', err);
    } finally {
      setLoadingCiudades(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!formData.nombre || !formData.email || !formData.password || !formData.telefono || !formData.direccion || !formData.id_ciudad) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#2d5016'
      });
      return;
    }

    if (formData.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña inválida',
        text: 'La contraseña debe tener al menos 6 caracteres',
        confirmButtonColor: '#2d5016'
      });
      return;
    }

    if (!formData.email.includes('@')) {
      Swal.fire({
        icon: 'warning',
        title: 'Email inválido',
        text: 'Por favor ingresa un email válido',
        confirmButtonColor: '#2d5016'
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await adminService.crearUsuario({
        nombre: formData.nombre.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        id_ciudad: Number(formData.id_ciudad),
        rol: formData.rol
      });
      
      if (response.success) {
        setFormData({
          nombre: '',
          email: '',
          password: '',
          telefono: '',
          direccion: '',
          id_ciudad: '',
          rol: 'consumidor'
        });
        onSuccess();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error creando usuario',
          confirmButtonColor: '#2d5016'
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.message || 'Error desconocido al crear usuario',
        confirmButtonColor: '#2d5016'
      });
    } finally {
      setLoading(false);
    }
  };

  console.log('[CreateUserModal] Renderizando modal, isOpen:', isOpen);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        console.log('[CreateUserModal] Cerrando modal');
        onClose();
      }} 
      title={
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <i className="bi bi-person-plus-fill me-2"></i>
          Crear Nuevo Usuario
        </span>
      }
      size="large"
    >
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="nombre" className="form-label">
              <i className="bi bi-person-fill me-2 text-primary"></i>
              Nombre completo <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-person-fill text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control"
                id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
            />
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="email" className="form-label">
              <i className="bi bi-envelope-fill me-2 text-primary"></i>
              Email <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-envelope-fill text-primary"></i>
              </span>
              <input
              type="email"
                className="form-control"
                id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              required
            />
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="password" className="form-label">
              <i className="bi bi-lock-fill me-2 text-primary"></i>
              Contraseña <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-lock-fill text-primary"></i>
              </span>
              <input
              type="password"
                className="form-control"
                id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
                minLength={6}
            />
            </div>
            <div className="form-text">La contraseña debe tener al menos 6 caracteres</div>
          </div>

          <div className="col-md-6">
            <label htmlFor="telefono" className="form-label">
              <i className="bi bi-telephone-fill me-2 text-primary"></i>
              Teléfono <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-telephone-fill text-primary"></i>
              </span>
              <input
                type="tel"
                className="form-control"
                id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="+57 300 123 4567"
              required
            />
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="direccion" className="form-label">
              <i className="bi bi-geo-alt-fill me-2 text-primary"></i>
              Dirección <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-geo-alt-fill text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control"
                id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección completa"
              required
            />
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="ciudad" className="form-label">
              <i className="bi bi-geo-fill me-2 text-primary"></i>
              Ciudad <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-geo-fill text-primary"></i>
              </span>
            <select
                className="form-select"
                id="ciudad"
              value={formData.id_ciudad}
              onChange={(e) => setFormData({ ...formData, id_ciudad: e.target.value })}
              required
              disabled={loadingCiudades}
            >
              <option value="">{loadingCiudades ? 'Cargando ciudades...' : 'Selecciona una ciudad'}</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="rol" className="form-label">
              <i className="bi bi-person-badge-fill me-2 text-primary"></i>
              Rol <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-person-badge-fill text-primary"></i>
              </span>
            <select
                className="form-select"
                id="rol"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
              required
            >
              <option value="consumidor">🛒 Consumidor</option>
              <option value="productor">🌱 Productor</option>
              <option value="admin">👨‍💼 Administrador</option>
            </select>
          </div>
        </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose} 
            disabled={loading}
          >
            <i className="bi bi-x-circle-fill me-2"></i>
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creando...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill me-2"></i>
                Crear Usuario
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UsuariosScreen;
