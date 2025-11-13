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
      const configData = {
        nombre_sistema: config.nombreSistema,
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
          <h1>Configuración del Sistema</h1>
          <p>Gestiona la configuración general de la plataforma</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={handleGuardar}
            loading={loading}
          >
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Información General */}
        <Card title="Información General">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Nombre del Sistema
              </label>
              <Input
                value={config.nombreSistema}
                onChange={(e) => setConfig({ ...config, nombreSistema: e.target.value })}
                placeholder="Nombre del sistema"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Email de Contacto
              </label>
              <Input
                type="email"
                value={config.emailContacto}
                onChange={(e) => setConfig({ ...config, emailContacto: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Teléfono de Contacto
              </label>
              <Input
                value={config.telefonoContacto}
                onChange={(e) => setConfig({ ...config, telefonoContacto: e.target.value })}
                placeholder="+57 300 000 0000"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Dirección
              </label>
              <Input
                value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                placeholder="Dirección"
              />
            </div>
          </div>
        </Card>

        {/* Configuración de Límites */}
        <Card title="Límites del Sistema">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Máximo de Productos por Usuario
              </label>
              <Input
                type="number"
                value={config.maxProductosUsuario}
                onChange={(e) => setConfig({ ...config, maxProductosUsuario: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Días de Expiración de Reportes
              </label>
              <Input
                type="number"
                value={config.diasExpiracionReportes}
                onChange={(e) => setConfig({ ...config, diasExpiracionReportes: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
          </div>
        </Card>

        {/* Estado del Sistema */}
        <Card title="Estado del Sistema">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={config.mantenimiento}
                onChange={(e) => setConfig({ ...config, mantenimiento: e.target.checked })}
              />
              <span>Modo Mantenimiento (el sistema estará inaccesible para usuarios)</span>
            </label>
          </div>
        </Card>
      </div>

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

