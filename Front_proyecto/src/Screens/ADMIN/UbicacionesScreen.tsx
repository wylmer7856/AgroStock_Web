// PANTALLA DE GESTIÓN DE UBICACIONES - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface Region {
  id_region: number;
  nombre: string;
}

interface Departamento {
  id_departamento: number;
  nombre: string;
  nombre_region?: string;
  id_region?: number;
}

interface Ciudad {
  id_ciudad: number;
  nombre: string;
  nombre_departamento?: string;
  id_departamento?: number;
}

interface UbicacionesScreenProps {
  onNavigate: (view: string) => void;
}

export const UbicacionesScreen: React.FC<UbicacionesScreenProps> = ({ onNavigate }) => {
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'regiones' | 'departamentos' | 'ciudades'>('regiones');

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      if (activeTab === 'regiones') {
        const response = await adminService.getRegiones();
        if (response.success && response.data) setRegiones(response.data);
      } else if (activeTab === 'departamentos') {
        const response = await adminService.getDepartamentos();
        if (response.success && response.data) setDepartamentos(response.data);
      } else {
        const response = await adminService.getCiudades();
        if (response.success && response.data) setCiudades(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando ubicaciones', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Ubicaciones</h1>
          <p>Administra regiones, departamentos y ciudades</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button variant="primary" onClick={cargarDatos}>Actualizar</Button>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
          <Button variant={activeTab === 'regiones' ? 'primary' : 'secondary'} onClick={() => setActiveTab('regiones')}>Regiones</Button>
          <Button variant={activeTab === 'departamentos' ? 'primary' : 'secondary'} onClick={() => setActiveTab('departamentos')}>Departamentos</Button>
          <Button variant={activeTab === 'ciudades' ? 'primary' : 'secondary'} onClick={() => setActiveTab('ciudades')}>Ciudades</Button>
        </div>

        <div className="usuarios-table-container">
          {activeTab === 'regiones' && (
            <table className="usuarios-table">
              <thead>
                <tr><th>ID</th><th>Nombre</th></tr>
              </thead>
              <tbody>
                {regiones.map((r) => (
                  <tr key={r.id_region}><td>{r.id_region}</td><td>{r.nombre}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'departamentos' && (
            <table className="usuarios-table">
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Región</th></tr>
              </thead>
              <tbody>
                {departamentos.map((d) => (
                  <tr key={d.id_departamento}><td>{d.id_departamento}</td><td>{d.nombre}</td><td>{d.nombre_region || 'N/A'}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'ciudades' && (
            <table className="usuarios-table">
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Departamento</th></tr>
              </thead>
              <tbody>
                {ciudades.map((c) => (
                  <tr key={c.id_ciudad}><td>{c.id_ciudad}</td><td>{c.nombre}</td><td>{c.nombre_departamento || 'N/A'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

