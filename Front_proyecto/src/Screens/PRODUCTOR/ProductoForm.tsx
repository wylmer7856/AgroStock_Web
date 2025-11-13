// 🛍️ FORMULARIO DE PRODUCTO - Crear y Editar

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Loading, Toast } from '../../components/ReusableComponents';
import { productosService, categoriasService, ubicacionesService, imagenesService } from '../../services';
import type { Producto } from '../../types';
import { BiLeftArrow, BiRightArrow, BiTrash, BiPlus } from 'react-icons/bi';
import './ProductorDashboard.css';

interface ProductoFormProps {
  productoId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductoForm: React.FC<ProductoFormProps> = ({ productoId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<Producto>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    stock_minimo: 5,
    unidad_medida: 'kg',
    id_categoria: null,
    id_ciudad_origen: null,
    imagen_principal: '',
    disponible: true
  });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenesAdicionales, setImagenesAdicionales] = useState<string[]>([]);
  const [imagenesAdicionalesFiles, setImagenesAdicionalesFiles] = useState<File[]>([]);
  const [imagenActualIndex, setImagenActualIndex] = useState(0);
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);

  useEffect(() => {
    cargarDatos();
    if (productoId) {
      cargarProducto();
    }
  }, [productoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [categoriasRes, ciudadesRes] = await Promise.all([
        categoriasService.listarCategorias(),
        ubicacionesService.listarCiudades()
      ]);

      if (categoriasRes.success && categoriasRes.data) {
        console.log('Categorías cargadas:', categoriasRes.data.length);
        setCategorias(categoriasRes.data);
      } else {
        console.error('Error cargando categorías:', categoriasRes);
        mostrarToast('Error cargando categorías', 'error');
      }

      if (ciudadesRes.success && ciudadesRes.data) {
        console.log('Ciudades cargadas:', ciudadesRes.data.length);
        setCiudades(ciudadesRes.data);
      } else {
        console.error('Error cargando ciudades:', ciudadesRes);
        mostrarToast('Error cargando ciudades', 'error');
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      mostrarToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarProducto = async () => {
    if (!productoId) return;
    
    try {
      setLoading(true);
      const response = await productosService.obtenerProducto(productoId);
      
      if (response.success && response.data) {
        setFormData({
          nombre: response.data.nombre,
          descripcion: response.data.descripcion || '',
          precio: response.data.precio,
          stock: response.data.stock,
          stock_minimo: response.data.stock_minimo,
          unidad_medida: response.data.unidad_medida,
          id_categoria: response.data.id_categoria || null,
          id_ciudad_origen: response.data.id_ciudad_origen || null,
          imagen_principal: response.data.imagen_principal || '',
          disponible: response.data.disponible
        });
        // Si hay imagen, establecer preview (usar imagenUrl si está disponible, sino construir URL)
        const imagenUrl = (response.data as any).imagenUrl || response.data.imagen_principal;
        if (imagenUrl) {
          // Si es una ruta relativa, construir URL completa
          let urlCompleta = imagenUrl;
          if (!imagenUrl.startsWith('http')) {
            const baseUrl = 'http://localhost:8000';
            urlCompleta = `${baseUrl}/${imagenUrl.replace(/^\/+/, '')}`;
          }
          setImagenPreview(urlCompleta);
          // Guardar la ruta original en formData para referencia
          setFormData(prev => ({ ...prev, imagen_principal: response.data.imagen_principal || imagenUrl }));
        } else {
          // Si no hay imagen, limpiar el preview
          setImagenPreview(null);
          setFormData(prev => ({ ...prev, imagen_principal: '' }));
        }
        
        // Cargar imágenes adicionales
        if (response.data.imagenes_adicionales) {
          let imagenes: string[] = [];
          try {
            if (typeof response.data.imagenes_adicionales === 'string') {
              imagenes = JSON.parse(response.data.imagenes_adicionales);
            } else if (Array.isArray(response.data.imagenes_adicionales)) {
              imagenes = response.data.imagenes_adicionales;
            }
            // Construir URLs completas para las imágenes adicionales
            const imagenesConUrl = imagenes.map((img: string) => {
              if (img.startsWith('http')) return img;
              const baseUrl = 'http://localhost:8000';
              return `${baseUrl}/${img.replace(/^\/+/, '')}`;
            });
            setImagenesAdicionales(imagenesConUrl);
            if (imagenesConUrl.length > 0) {
              setImagenActualIndex(0);
            }
          } catch (error) {
            console.error('Error parseando imágenes adicionales:', error);
            setImagenesAdicionales([]);
          }
        } else {
          setImagenesAdicionales([]);
        }
      }
    } catch (error) {
      mostrarToast('Error cargando producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        mostrarToast('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarToast('La imagen no debe superar los 5MB', 'error');
        return;
      }

      setImagenFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagenesAdicionalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const archivosValidos: File[] = [];
      
      Array.from(files).forEach(file => {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          mostrarToast(`El archivo ${file.name} no es una imagen válida`, 'error');
          return;
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          mostrarToast(`La imagen ${file.name} excede los 5MB`, 'error');
          return;
        }
        
        archivosValidos.push(file);
      });

      if (archivosValidos.length > 0) {
        setImagenesAdicionalesFiles(prev => [...prev, ...archivosValidos]);
        mostrarToast(`${archivosValidos.length} imagen(es) seleccionada(s)`, 'success');
      }
      
      // Limpiar el input
      e.target.value = '';
    }
  };

  const eliminarImagenAdicional = async (index: number) => {
    if (!productoId) {
      // Si es creación, solo eliminar del estado local
      if (index < imagenesAdicionales.length) {
        // Eliminar de imágenes existentes (no debería pasar en creación, pero por si acaso)
        const nuevasImagenes = [...imagenesAdicionales];
        nuevasImagenes.splice(index, 1);
        setImagenesAdicionales(nuevasImagenes);
        const nuevoTotal = nuevasImagenes.length + imagenesAdicionalesFiles.length;
        if (nuevoTotal > 0 && imagenActualIndex >= nuevoTotal) {
          setImagenActualIndex(nuevoTotal - 1);
        } else if (nuevoTotal === 0) {
          setImagenActualIndex(0);
        }
      } else {
        // Eliminar de nuevas imágenes
        const indexEnFiles = index - imagenesAdicionales.length;
        const nuevosFiles = [...imagenesAdicionalesFiles];
        nuevosFiles.splice(indexEnFiles, 1);
        setImagenesAdicionalesFiles(nuevosFiles);
        const nuevoTotal = imagenesAdicionales.length + nuevosFiles.length;
        if (nuevoTotal > 0 && imagenActualIndex >= nuevoTotal) {
          setImagenActualIndex(nuevoTotal - 1);
        } else if (nuevoTotal === 0) {
          setImagenActualIndex(0);
        }
      }
      return;
    }

    // Si es edición, verificar si es una imagen existente o nueva
    if (index < imagenesAdicionales.length) {
      // Eliminar imagen existente del servidor
      try {
        const response = await productosService.eliminarImagenAdicional(productoId, index);
        if (response.success && response.data) {
          const nuevasImagenes = response.data.imagenes_adicionales.map((img: string) => {
            if (img.startsWith('http')) return img;
            const baseUrl = 'http://localhost:8000';
            return `${baseUrl}/${img.replace(/^\/+/, '')}`;
          });
          setImagenesAdicionales(nuevasImagenes);
          const nuevoTotal = nuevasImagenes.length + imagenesAdicionalesFiles.length;
          if (nuevoTotal > 0 && imagenActualIndex >= nuevoTotal) {
            setImagenActualIndex(nuevoTotal - 1);
          } else if (nuevoTotal === 0) {
            setImagenActualIndex(0);
          }
          mostrarToast('Imagen eliminada exitosamente', 'success');
          queryClient.invalidateQueries({ queryKey: ['productos', 'productor'] });
        }
      } catch (error) {
        console.error('Error eliminando imagen adicional:', error);
        mostrarToast('Error al eliminar la imagen', 'error');
      }
    } else {
      // Eliminar nueva imagen del estado local
      const indexEnFiles = index - imagenesAdicionales.length;
      const nuevosFiles = [...imagenesAdicionalesFiles];
      nuevosFiles.splice(indexEnFiles, 1);
      setImagenesAdicionalesFiles(nuevosFiles);
      
      // Ajustar el índice actual
      const nuevoTotal = imagenesAdicionales.length + nuevosFiles.length;
      if (nuevoTotal > 0 && imagenActualIndex >= nuevoTotal) {
        setImagenActualIndex(nuevoTotal - 1);
      } else if (nuevoTotal === 0) {
        setImagenActualIndex(0);
      }
    }
  };

  const siguienteImagen = () => {
    const total = imagenesAdicionales.length + imagenesAdicionalesFiles.length;
    if (total > 0) {
      setImagenActualIndex((prev) => (prev + 1) % total);
    }
  };

  const anteriorImagen = () => {
    const total = imagenesAdicionales.length + imagenesAdicionalesFiles.length;
    if (total > 0) {
      setImagenActualIndex((prev) => (prev - 1 + total) % total);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio || formData.precio <= 0) {
      mostrarToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    try {
      setSaving(true);
      const userId = user?.id_usuario || user?.id;
      
      // Si es edición y solo hay imagen nueva (sin cambios en otros campos), subir solo la imagen
      if (productoId && imagenFile && !formData.nombre && !formData.precio) {
        try {
          const imagenResponse = await productosService.subirImagenProducto(productoId, imagenFile);
          if (imagenResponse.success) {
            queryClient.invalidateQueries({ queryKey: ['productos', 'productor'] });
            mostrarToast('Imagen actualizada exitosamente', 'success');
            onSuccess();
            return;
          }
        } catch (error) {
          console.error('Error subiendo imagen:', error);
          // Si falla, continuar con el flujo normal de actualización
        }
      }
      
      const productoData: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: Number(formData.precio),
        stock: Number(formData.stock) || 0,
        stock_minimo: Number(formData.stock_minimo) || 5,
        unidad_medida: formData.unidad_medida || 'kg',
        id_usuario: userId,
        id_categoria: formData.id_categoria || null,
        id_ciudad_origen: formData.id_ciudad_origen || null,
        disponible: formData.disponible !== false
      };

      let response;
      let productoIdFinal = productoId;
      
      if (productoId) {
        // Si es edición, actualizar el producto
        response = await productosService.actualizarProducto(productoId, productoData);
        productoIdFinal = productoId;
      } else {
        // Si es creación, crear el producto
        response = await productosService.crearProducto(productoData);
        console.log('Respuesta al crear producto:', response);
        
        // El backend puede retornar el producto completo en response.data
        if (response.success && response.data) {
          // Intentar obtener el id_producto de diferentes formas
          productoIdFinal = (response.data as any).id_producto || 
                          (response.data as any).id || 
                          null;
          
          if (productoIdFinal) {
            console.log('Producto creado con ID:', productoIdFinal);
          } else {
            console.warn('No se pudo obtener el ID del producto creado:', response.data);
          }
        }
      }

      if (response.success) {
        // Si no tenemos productoIdFinal pero la respuesta fue exitosa, intentar continuar
        if (!productoIdFinal && !productoId) {
          console.warn('Producto creado pero no se obtuvo ID, continuando de todas formas');
        }
        
        // Mostrar mensaje de éxito inmediatamente
        mostrarToast(
          productoId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
          'success'
        );
        
        // Llamar onSuccess inmediatamente para navegar rápido
        onSuccess();
        
        // Subir imagen principal en segundo plano (no bloquea la navegación)
        if (imagenFile && productoIdFinal) {
          // Subir imagen de forma asíncrona sin bloquear
          productosService.subirImagenProducto(productoIdFinal, imagenFile)
            .then((imagenResponse) => {
              if (imagenResponse.success) {
                console.log('Imagen principal subida exitosamente');
                // Invalidar queries para refrescar con la nueva imagen
                queryClient.invalidateQueries({ queryKey: ['productos', 'productor'] });
              }
            })
            .catch((error) => {
              console.error('Error subiendo imagen principal:', error);
              // No mostrar error crítico, solo log
            });
        } else if (imagenFile && !productoIdFinal) {
          console.warn('No se pudo subir la imagen porque no se obtuvo el ID del producto');
        }

        // Subir imágenes adicionales en segundo plano
        if (imagenesAdicionalesFiles.length > 0 && productoIdFinal) {
          setSubiendoImagenes(true);
          Promise.all(
            imagenesAdicionalesFiles.map(file => 
              productosService.subirImagenAdicional(productoIdFinal, file)
            )
          )
            .then((responses) => {
              const exitosas = responses.filter(r => r.success).length;
              console.log(`${exitosas} imagen(es) adicional(es) subida(s) exitosamente`);
              setImagenesAdicionalesFiles([]);
              queryClient.invalidateQueries({ queryKey: ['productos', 'productor'] });
              // Recargar el producto para obtener las nuevas imágenes
              if (productoIdFinal) {
                setTimeout(() => {
                  cargarProducto();
                }, 1000); // Esperar un poco para que el servidor procese
              }
            })
            .catch((error) => {
              console.error('Error subiendo imágenes adicionales:', error);
              mostrarToast('Algunas imágenes adicionales no se pudieron subir', 'error');
            })
            .finally(() => {
              setSubiendoImagenes(false);
            });
        }
      } else {
        const errorMsg = response.message || response.error || 'Error guardando producto';
        console.error('Error en respuesta:', response);
        mostrarToast(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      mostrarToast(error.message || 'Error guardando producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  if (loading && productoId) {
    return <Loading message="Cargando producto..." />;
  }

  return (
    <div className="producto-form">
      <div className="form-header">
        <h2>{productoId ? '✏️ Editar Producto' : '➕ Crear Nuevo Producto'}</h2>
        <Button variant="secondary" onClick={onClose}>
          ← Volver
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="producto-form-content">
        <Card className="form-section">
          <h3>📋 Información Básica</h3>
          
          <div className="form-group">
            <label>Nombre del Producto *</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Tomates orgánicos"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe tu producto..."
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio por Unidad (COP) *</label>
              <input
                type="number"
                value={formData.precio || ''}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="100"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Unidad de Medida *</label>
              <select
                value={formData.unidad_medida || 'kg'}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                required
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="lb">Libras (lb)</option>
                <option value="unidad">Unidad</option>
                <option value="litro">Litros (L)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="docena">Docena</option>
                <option value="caja">Caja</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="form-section">
          <h3>📦 Inventario</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Stock Disponible *</label>
              <input
                type="number"
                value={formData.stock || ''}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Stock Mínimo *</label>
              <input
                type="number"
                value={formData.stock_minimo || 5}
                onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 5 })}
                placeholder="5"
                min="0"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.disponible !== false}
                onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
              />
              {' '}Producto disponible para venta
            </label>
          </div>
        </Card>

        <Card className="form-section">
          <h3>🏷️ Clasificación</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={formData.id_categoria ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    id_categoria: value === '' ? null : parseInt(value) 
                  });
                }}
                className="form-input"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.length > 0 ? (
                  categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando categorías...</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Ciudad de Origen</label>
              <select
                value={formData.id_ciudad_origen ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ 
                    ...formData, 
                    id_ciudad_origen: value === '' ? null : parseInt(value) 
                  });
                }}
                className="form-input"
              >
                <option value="">Seleccionar ciudad</option>
                {ciudades.length > 0 ? (
                  ciudades.map(ciudad => (
                    <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                      {ciudad.nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando ciudades...</option>
                )}
              </select>
            </div>
          </div>
        </Card>

        <Card className="form-section">
          <h3>🖼️ Imagen Principal del Producto</h3>
          
          <div className="form-group">
            <label>Seleccionar Imagen Principal</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-input"
            />
            <small>Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB</small>
            
            {imagenPreview && (
              <div className="image-preview-container">
                <img 
                  src={imagenPreview} 
                  alt="Vista previa" 
                  className="image-preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagenFile(null);
                    setImagenPreview(null);
                  }}
                  className="remove-image-btn"
                >
                  ✕ Eliminar imagen
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card className="form-section">
          <h3>📸 Imágenes Adicionales del Producto</h3>
          
          <div className="form-group">
            <label>Seleccionar Imágenes Adicionales (Múltiples)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagenesAdicionalesChange}
              className="form-input"
              disabled={subiendoImagenes}
            />
            <small>Puedes seleccionar múltiples imágenes. Formatos: JPG, PNG, GIF. Tamaño máximo por imagen: 5MB</small>
            
            {(imagenesAdicionales.length > 0 || imagenesAdicionalesFiles.length > 0) && (
              <div className="galeria-imagenes-container" style={{ marginTop: '20px' }}>
                <div className="galeria-imagenes-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    📸 Imagen {imagenActualIndex + 1} de {imagenesAdicionales.length + imagenesAdicionalesFiles.length}
                  </span>
                </div>
                
                <div className="galeria-imagen-actual" style={{ marginBottom: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div className="d-flex align-items-center" style={{ position: 'relative' }}>
                    {(imagenesAdicionales.length + imagenesAdicionalesFiles.length) > 1 && (
                      <button
                        type="button"
                        onClick={anteriorImagen}
                        className="btn"
                        style={{ 
                          background: 'white',
                          color: '#333',
                          border: '2px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '28px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          fontWeight: 'bold',
                          margin: 0,
                          padding: 0,
                          flexShrink: 0,
                          marginRight: '10px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f0f0';
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                        }}
                        title="Imagen anterior"
                      >
                        <BiLeftArrow />
                      </button>
                    )}
                    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                      {imagenActualIndex < imagenesAdicionales.length ? (
                        <img 
                          src={imagenesAdicionales[imagenActualIndex]} 
                          alt={`Imagen adicional ${imagenActualIndex + 1}`}
                          style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd', display: 'block', margin: '0 auto' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={URL.createObjectURL(imagenesAdicionalesFiles[imagenActualIndex - imagenesAdicionales.length])} 
                            alt={`Nueva imagen ${imagenActualIndex + 1}`}
                            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd', display: 'block', margin: '0 auto' }}
                          />
                          <span 
                            style={{ 
                              position: 'absolute', 
                              top: '10px', 
                              right: '10px', 
                              background: 'rgba(255, 193, 7, 0.9)', 
                              padding: '5px 10px', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              zIndex: 5
                            }}
                          >
                            Nueva
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarImagenAdicional(imagenActualIndex)}
                        className="btn btn-sm btn-danger"
                        style={{ 
                          position: 'absolute', 
                          bottom: '20px', 
                          right: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        <BiTrash /> Eliminar
                      </button>
                    </div>
                    {(imagenesAdicionales.length + imagenesAdicionalesFiles.length) > 1 && (
                      <button
                        type="button"
                        onClick={siguienteImagen}
                        className="btn"
                        style={{ 
                          background: 'white',
                          color: '#333',
                          border: '2px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '28px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          fontWeight: 'bold',
                          margin: 0,
                          padding: 0,
                          flexShrink: 0,
                          marginLeft: '10px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f0f0';
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                        }}
                        title="Siguiente imagen"
                      >
                        <BiRightArrow />
                      </button>
                    )}
                  </div>
                </div>

                {subiendoImagenes && (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                    ⏳ Subiendo imágenes...
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="form-actions">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            loading={saving}
          >
            {productoId ? '💾 Actualizar Producto' : '➕ Crear Producto'}
          </Button>
        </div>
      </form>

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

