// PANTALLA DE GESTIÓN DE CATEGORÍAS - ADMIN

import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Input, Modal, Loading, Badge, Toast } from '../../components/ReusableComponents';
import type { Categoria } from '../../types';
import './AdminScreens.css';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activa: boolean;
  total_productos?: number;
}

interface CategoriasScreenProps {
  onNavigate: (view: string) => void;
}

export const CategoriasScreen: React.FC<CategoriasScreenProps> = ({ onNavigate }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', icono: '', activa: true });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    cargarCategorias();
  }, [busquedaDebounced]);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[CategoriasScreen] Cargando categorías...');
      const response = await adminService.getCategorias();
      console.log('[CategoriasScreen] Respuesta recibida:', response);
      
      if (response.success && response.data) {
        let categoriasFiltradas = response.data;
        
        if (busquedaDebounced) {
          categoriasFiltradas = categoriasFiltradas.filter(c => 
            c.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            c.descripcion?.toLowerCase().includes(busquedaDebounced.toLowerCase())
          );
        }
        
        setCategorias(categoriasFiltradas);
        console.log('[CategoriasScreen] Categorías cargadas:', categoriasFiltradas.length);
      } else {
        setError(response.message || 'Error cargando categorías');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[CategoriasScreen] Excepción:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCategoria = async () => {
    try {
      // El backend espera el endpoint /categorias/admin/crear según el router
      const response = await adminService.crearCategoria(formData);
      
      if (response.success) {
        mostrarToast('Categoría creada exitosamente', 'success');
        setShowCreateModal(false);
        setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
        cargarCategorias();
      } else {
        mostrarToast(response.message || 'Error creando categoría', 'error');
      }
    } catch (err) {
      mostrarToast('Error creando categoría', 'error');
    }
  };

  const handleEditarCategoria = async () => {
    if (!categoriaSeleccionada) return;
    
    try {
      const response = await adminService.editarCategoria(
        categoriaSeleccionada.id_categoria,
        formData
      );
      
      if (response.success) {
        mostrarToast('Categoría actualizada exitosamente', 'success');
        setShowEditModal(false);
        setCategoriaSeleccionada(null);
        setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
        cargarCategorias();
      } else {
        mostrarToast(response.message || 'Error actualizando categoría', 'error');
      }
    } catch (err) {
      mostrarToast('Error actualizando categoría', 'error');
    }
  };

  const handleEliminarCategoria = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;
    
    try {
      const response = await adminService.eliminarCategoria(id);
      
      if (response.success) {
        mostrarToast('Categoría eliminada exitosamente', 'success');
        cargarCategorias();
      } else {
        mostrarToast(response.message || 'Error eliminando categoría', 'error');
      }
    } catch (err) {
      mostrarToast('Error eliminando categoría', 'error');
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const abrirModalEditar = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      icono: categoria.icono || '',
      activa: categoria.activa
    });
    setShowEditModal(true);
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías de productos del sistema</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => {
              setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
              setShowCreateModal(true);
            }}
          >
            Nueva Categoría
          </Button>
          <Button
            variant="secondary"
            onClick={cargarCategorias}
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
              onClick={cargarCategorias}
              style={{ marginTop: '10px' }}
            >
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      {/* Búsqueda */}
      <Card style={{ marginBottom: '20px' }}>
        <Input
          type="text"
          placeholder="Buscar categorías..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Card>

      {/* Lista de categorías */}
      {loading ? (
        <Loading />
      ) : categorias.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No se encontraron categorías</p>
          </div>
        </Card>
      ) : (
        <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {categorias.map((categoria) => (
            <Card key={categoria.id_categoria}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{categoria.nombre}</h3>
                    {categoria.descripcion && (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {categoria.descripcion}
                      </p>
                    )}
                  </div>
                  <Badge variant={categoria.activa ? 'success' : 'error'}>
                    {categoria.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                
                {categoria.total_productos !== undefined && (
                  <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    {categoria.total_productos} productos
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    size="small"
                    variant="info"
                    onClick={() => abrirModalEditar(categoria)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    variant="error"
                    onClick={() => handleEliminarCategoria(categoria.id_categoria)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
          }}
          title="Nueva Categoría"
        >
          <div style={{ padding: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Nombre *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la categoría"
              style={{ marginBottom: '1rem' }}
            />
            
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '1rem',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
            />
            
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Icono
            </label>
            <Input
              value={formData.icono}
              onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
              placeholder="Nombre del icono"
              style={{ marginBottom: '1rem' }}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              />
              <span>Categoría activa</span>
            </label>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCrearCategoria}
                disabled={!formData.nombre.trim()}
              >
                Crear
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal editar */}
      {showEditModal && categoriaSeleccionada && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setCategoriaSeleccionada(null);
            setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
          }}
          title="Editar Categoría"
        >
          <div style={{ padding: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Nombre *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la categoría"
              style={{ marginBottom: '1rem' }}
            />
            
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '1rem',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
            />
            
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Icono
            </label>
            <Input
              value={formData.icono}
              onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
              placeholder="Nombre del icono"
              style={{ marginBottom: '1rem' }}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              />
              <span>Categoría activa</span>
            </label>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setCategoriaSeleccionada(null);
                  setFormData({ nombre: '', descripcion: '', icono: '', activa: true });
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleEditarCategoria}
                disabled={!formData.nombre.trim()}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
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

