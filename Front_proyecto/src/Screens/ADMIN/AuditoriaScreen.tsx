// PANTALLA DE AUDITORÍA Y LOGS - ADMIN

import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Input, Loading, Badge, Toast } from '../../components/ReusableComponents';
import './AdminScreens.css';

interface AccionAuditoria {
  id_bitacora: number;
  tabla: string;
  id_registro: number;
  accion: string;
  usuario: string;
  fecha: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip?: string;
}

interface AuditoriaScreenProps {
  onNavigate: (view: string) => void;
}

export const AuditoriaScreen: React.FC<AuditoriaScreenProps> = ({ onNavigate }) => {
  const [acciones, setAcciones] = useState<AccionAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTabla, setFiltroTabla] = useState<string>('todas');
  const [filtroAccion, setFiltroAccion] = useState<string>('todas');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    cargarAcciones();
  }, [filtroTabla, filtroAccion, busquedaDebounced]);

  const cargarAcciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[AuditoriaScreen] Cargando acciones de auditoría...');
      const response = await adminService.getAuditoriaLogs({
        tabla: filtroTabla !== 'todas' ? filtroTabla : undefined,
        accion: filtroAccion !== 'todas' ? filtroAccion : undefined
      });
      console.log('[AuditoriaScreen] Respuesta recibida:', response);
      
      if (response.success && response.data) {
        let accionesFiltradas = response.data;
        
        if (filtroTabla !== 'todas') {
          accionesFiltradas = accionesFiltradas.filter(a => a.tabla === filtroTabla);
        }
        
        if (filtroAccion !== 'todas') {
          accionesFiltradas = accionesFiltradas.filter(a => a.accion === filtroAccion);
        }
        
        if (busquedaDebounced) {
          accionesFiltradas = accionesFiltradas.filter(a =>
            a.usuario.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            a.tabla.toLowerCase().includes(busquedaDebounced.toLowerCase())
          );
        }
        
        setAcciones(accionesFiltradas);
        console.log('[AuditoriaScreen] Acciones cargadas:', accionesFiltradas.length);
      } else {
        setError(response.message || 'Error cargando acciones de auditoría');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[AuditoriaScreen] Excepción:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccionBadge = (accion: string) => {
    const acciones: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', label: string }> = {
      'INSERT': { variant: 'success', label: 'Crear' },
      'UPDATE': { variant: 'info', label: 'Actualizar' },
      'DELETE': { variant: 'error', label: 'Eliminar' },
      'SELECT': { variant: 'info', label: 'Consultar' }
    };
    
    const accionInfo = acciones[accion] || { variant: 'info' as const, label: accion };
    return <Badge variant={accionInfo.variant}>{accionInfo.label}</Badge>;
  };

  const tablasUnicas = Array.from(new Set(acciones.map(a => a.tabla)));
  const accionesUnicas = Array.from(new Set(acciones.map(a => a.accion)));

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Auditoría del Sistema</h1>
          <p>Registro de todas las acciones realizadas en el sistema</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button
            variant="primary"
            onClick={cargarAcciones}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="error-card" style={{ marginBottom: '20px' }}>
          <div style={{ padding: '15px' }}>
            <strong>Error:</strong> {error}
            <br />
            <Button
              variant="secondary"
              size="small"
              onClick={cargarAcciones}
              style={{ marginTop: '10px' }}
            >
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Buscar por usuario o tabla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Tabla
            </label>
            <select
              value={filtroTabla}
              onChange={(e) => setFiltroTabla(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              <option value="todas">Todas</option>
              {tablasUnicas.map(tabla => (
                <option key={tabla} value={tabla}>{tabla}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Acción
            </label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              <option value="todas">Todas</option>
              {accionesUnicas.map(accion => (
                <option key={accion} value={accion}>{accion}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de acciones */}
      {loading ? (
        <Loading />
      ) : acciones.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No se encontraron acciones de auditoría</p>
          </div>
        </Card>
      ) : (
        <div className="auditoria-cards-grid">
          {acciones.map((accion) => (
            <Card key={accion.id_bitacora} className="auditoria-card">
              <div className="auditoria-card-header">
                <div className="auditoria-id">#{accion.id_bitacora}</div>
                <div className="auditoria-fecha">{formatearFecha(accion.fecha)}</div>
              </div>

              <div className="auditoria-card-body">
                <div className="auditoria-info-grid">
                  <div className="auditoria-info-item">
                    <span className="auditoria-info-label">Usuario</span>
                    <span className="auditoria-info-value">{accion.usuario}</span>
                  </div>
                  <div className="auditoria-info-item">
                    <span className="auditoria-info-label">Tabla</span>
                    <code className="auditoria-info-value" style={{ 
                      background: 'var(--admin-bg-secondary)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.8125rem'
                    }}>{accion.tabla}</code>
                  </div>
                  <div className="auditoria-info-item">
                    <span className="auditoria-info-label">Acción</span>
                    <span className="auditoria-info-value">{getAccionBadge(accion.accion)}</span>
                  </div>
                  <div className="auditoria-info-item">
                    <span className="auditoria-info-label">ID Registro</span>
                    <span className="auditoria-info-value">#{accion.id_registro}</span>
                  </div>
                  {accion.ip && (
                    <div className="auditoria-info-item">
                      <span className="auditoria-info-label">IP</span>
                      <span className="auditoria-info-value" style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                        {accion.ip}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

