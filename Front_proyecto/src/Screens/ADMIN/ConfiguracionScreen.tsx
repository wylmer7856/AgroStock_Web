// PANTALLA DE CONFIGURACIÓN DEL SISTEMA - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Input, Loading, Toast } from '../../components/ReusableComponents';
import './AdminScreens.css';

interface ConfiguracionScreenProps {
  onNavigate: (view: string) => void;
}

export const ConfiguracionScreen: React.FC<ConfiguracionScreenProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [config, setConfig] = useState({
    nombreSistema: 'AgroStock',
    emailContacto: 'contacto@agrostock.com',
    telefonoContacto: '+57 300 000 0000',
    direccion: 'Colombia',
    mantenimiento: false,
    maxProductosUsuario: 100,
    diasExpiracionReportes: 30
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemConfig();
      if (response.success && response.data) {
        setConfig({
          nombreSistema: response.data.nombre_sistema || 'AgroStock',
          emailContacto: response.data.email_contacto || 'contacto@agrostock.com',
          telefonoContacto: response.data.telefono_contacto || '+57 300 000 0000',
          direccion: response.data.direccion || 'Colombia',
          mantenimiento: response.data.mantenimiento || false,
          maxProductosUsuario: response.data.limite_productos || 100,
          diasExpiracionReportes: response.data.dias_expiracion_reportes || 30
        });
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
      // Solo guardar estado del sistema y límites (no información del sistema)
      const configData = {
        nombre_sistema: config.nombreSistema, // Mantener valores actuales
        email_contacto: config.emailContacto,
        telefono_contacto: config.telefonoContacto,
        direccion: config.direccion,
        mantenimiento: config.mantenimiento,
        limite_productos: config.maxProductosUsuario,
        dias_expiracion_reportes: config.diasExpiracionReportes
      };
      
      const response = await adminService.updateSystemConfig(configData);
      
      if (response.success) {
        mostrarToast('Configuración guardada exitosamente', 'success');
        // Recargar configuración para asegurar sincronización
        await cargarConfiguracion();
      } else {
        mostrarToast(response.message || 'Error guardando configuración', 'error');
      }
    } catch (err) {
      mostrarToast('Error guardando configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1><i className="bi bi-gear-fill"></i> Configuración del Sistema</h1>
          <p>Gestiona la configuración general de la plataforma</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={handleGuardar}
            loading={loading}
          >
            💾 Guardar Cambios
          </Button>
        </div>
      </div>

      {loading && !config.nombreSistema ? (
        <Loading text="Cargando configuración..." />
      ) : (
        <div className="configuracion-grid">
          {/* Información General - Solo Lectura */}
          <Card className="configuracion-card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-info-circle"></i> Información del Sistema
              </h3>
            </div>
            <div className="card-body">
              <div className="info-group">
                <label className="info-label">
                  <i className="bi bi-building"></i> Nombre del Sistema
                </label>
                <div className="info-value">
                  {config.nombreSistema}
                </div>
              </div>
              
              <div className="info-group">
                <label className="info-label">
                  <i className="bi bi-envelope"></i> Email de Contacto
                </label>
                <div className="info-value">
                  {config.emailContacto}
                </div>
              </div>
              
              <div className="info-group">
                <label className="info-label">
                  <i className="bi bi-telephone"></i> Teléfono de Contacto
                </label>
                <div className="info-value">
                  {config.telefonoContacto}
                </div>
              </div>
              
              <div className="info-group">
                <label className="info-label">
                  <i className="bi bi-geo-alt"></i> Dirección
                </label>
                <div className="info-value">
                  {config.direccion}
                </div>
              </div>
            </div>
          </Card>

          {/* Configuración de Límites */}
          <Card className="configuracion-card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-sliders"></i> Límites del Sistema
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-box-seam"></i> Máximo de Productos por Usuario
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-box-seam"></i></span>
                  <input
                    type="number"
                    className="form-control"
                    value={config.maxProductosUsuario}
                    onChange={(e) => setConfig({ ...config, maxProductosUsuario: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
                <small className="form-text text-muted">Límite máximo de productos que puede crear un usuario</small>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-calendar-x"></i> Días de Expiración de Reportes
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-calendar-x"></i></span>
                  <input
                    type="number"
                    className="form-control"
                    value={config.diasExpiracionReportes}
                    onChange={(e) => setConfig({ ...config, diasExpiracionReportes: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
                <small className="form-text text-muted">Número de días antes de que los reportes expiren automáticamente</small>
              </div>
            </div>
          </Card>

          {/* Estado del Sistema */}
          <Card className="configuracion-card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-shield-check"></i> Estado del Sistema
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="modoMantenimiento"
                    checked={config.mantenimiento}
                    onChange={(e) => setConfig({ ...config, mantenimiento: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="modoMantenimiento">
                    <i className="bi bi-tools"></i> Modo Mantenimiento
                  </label>
                </div>
                <small className="form-text text-muted d-block mt-2">
                  {config.mantenimiento ? (
                    <span className="text-warning">
                      <i className="bi bi-exclamation-triangle"></i> El sistema está en mantenimiento. Los usuarios no podrán acceder.
                    </span>
                  ) : (
                    <span className="text-success">
                      <i className="bi bi-check-circle"></i> El sistema está operativo.
                    </span>
                  )}
                </small>
              </div>
            </div>
          </Card>
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

