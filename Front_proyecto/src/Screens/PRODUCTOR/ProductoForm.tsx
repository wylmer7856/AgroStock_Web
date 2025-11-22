// 🛍️ FORMULARIO DE PRODUCTO - Crear y Editar

import React, { useState, useEffect, useRef } from 'react';
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

export const ProductoForm: React.FC<ProductoFormProps> = React.memo(({ productoId, onClose, onSuccess }) => {
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
    precio: undefined,
    stock: undefined,
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
  const [camposVacios, setCamposVacios] = useState<Set<string>>(new Set());
  const datosCargadosRef = useRef(false);
  const formDataInicializadoRef = useRef(false);
  const preventResetRef = useRef(false);
  
  // Guardar estado del formulario en sessionStorage para prevenir pérdida de datos
  useEffect(() => {
    // Solo guardar si es creación (no edición) y hay datos ingresados
    if (!productoId && preventResetRef.current && formData.nombre) {
      const estadoAGuardar = {
        formData,
        imagenPreview,
        timestamp: Date.now()
      };
      
      try {
        sessionStorage.setItem('productoFormData', JSON.stringify(estadoAGuardar));
      } catch (error) {
        console.error('Error guardando estado del formulario:', error);
      }
    }
  }, [formData, imagenPreview, productoId]);
  
  // Guardar también cuando la ventana pierde el foco
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!productoId && preventResetRef.current && formData.nombre) {
        try {
          sessionStorage.setItem('productoFormData', JSON.stringify({
            formData,
            imagenPreview,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Error guardando estado antes de cerrar:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, imagenPreview, productoId]);
  
  // Restaurar estado del formulario si existe en sessionStorage (solo para creación)
  useEffect(() => {
    if (!productoId && !formDataInicializadoRef.current) {
      const estadoGuardado = sessionStorage.getItem('productoFormData');
      if (estadoGuardado) {
        try {
          const { formData: savedFormData, imagenPreview: savedPreview, timestamp } = JSON.parse(estadoGuardado);
          // Solo restaurar si el estado es reciente (menos de 1 hora)
          if (Date.now() - timestamp < 3600000 && savedFormData.nombre) {
            preventResetRef.current = true;
            setFormData(savedFormData);
            if (savedPreview) {
              setImagenPreview(savedPreview);
            }
            // Limpiar el estado guardado después de restaurarlo
            sessionStorage.removeItem('productoFormData');
          }
        } catch (error) {
          console.error('Error restaurando estado del formulario:', error);
        }
      }
    }
  }, [productoId]);

  useEffect(() => {
    // Solo ejecutar la inicialización una vez cuando el componente se monta
    // Esto previene que se resetee el formulario mientras el usuario está escribiendo
    if (formDataInicializadoRef.current) {
      return;
    }
    
    formDataInicializadoRef.current = true;
    preventResetRef.current = true; // Activar protección contra reset
    
    // Cargar datos de categorías y ciudades solo una vez
    if (!datosCargadosRef.current) {
      datosCargadosRef.current = true;
      cargarDatos();
    }
    
    // Solo cargar producto si hay productoId
    if (productoId) {
      cargarProducto();
    } else {
      // Si es creación y no hay datos guardados, marcar todos los campos como inválidos inicialmente
      if (!sessionStorage.getItem('productoFormData')) {
        setCamposVacios(new Set(['nombre', 'precio', 'stock', 'stock_minimo', 'unidad_medida']));
      }
    }
    
    // Prevenir que el formulario se resetee cuando la ventana recupera el foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && preventResetRef.current) {
        // No hacer nada, solo prevenir reset
        console.log('Ventana recuperó foco, pero el formulario está protegido');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío para que solo se ejecute una vez al montar

  // Prevenir recargas automáticas cuando el formulario está montado
  // Usar useRef para rastrear si el formulario está montado y prevenir recargas
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cargarDatos = async () => {
    // Solo cargar datos si el formulario está montado y no hay datos ya cargados
    if (!isMountedRef.current || categorias.length > 0 || ciudades.length > 0) {
      return;
    }
    
    try {
      setLoading(true);
      const [categoriasRes, ciudadesRes] = await Promise.all([
        categoriasService.listarCategorias(),
        ubicacionesService.listarCiudades()
      ]);

      // Verificar nuevamente si el formulario está montado antes de actualizar el estado
      if (!isMountedRef.current) return;

      if (categoriasRes.success && categoriasRes.data) {
        console.log('Categorías cargadas:', categoriasRes.data.length);
        setCategorias(categoriasRes.data);
      } else {
        console.error('Error cargando categorías:', categoriasRes);
        // No mostrar toast si el usuario ya está escribiendo
        if (!formData.nombre) {
          mostrarToast('Error cargando categorías', 'error');
        }
      }

      if (ciudadesRes.success && ciudadesRes.data) {
        console.log('Ciudades cargadas:', ciudadesRes.data.length);
        setCiudades(ciudadesRes.data);
      } else {
        console.error('Error cargando ciudades:', ciudadesRes);
        // No mostrar toast si el usuario ya está escribiendo
        if (!formData.nombre) {
          mostrarToast('Error cargando ciudades', 'error');
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Error cargando datos:', error);
      // No mostrar toast si el usuario ya está escribiendo
      if (!formData.nombre) {
        mostrarToast('Error cargando datos', 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const cargarProducto = async () => {
    if (!productoId || !isMountedRef.current) return;
    
    try {
      setLoading(true);
      const response = await productosService.obtenerProducto(productoId);
      
      // Verificar nuevamente si el formulario está montado antes de actualizar el estado
      if (!isMountedRef.current) return;
      
      if (response.success && response.data) {
        // Solo actualizar formData si es edición (productoId existe) y no hay datos ingresados por el usuario
        // Esto previene que se reseteen los datos mientras el usuario está escribiendo
        if (productoId) {
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
          // Si es edición, limpiar los campos vacíos ya que todos tienen valores
          setCamposVacios(new Set());
        }
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
      if (!isMountedRef.current) return;
      mostrarToast('Error cargando producto', 'error');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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
          // No invalidar queries aquí para evitar recargas mientras el formulario está abierto
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

  const validarCampos = (): boolean => {
    const camposInvalidos = new Set<string>();
    
    // Validar nombre - debe tener al menos 1 carácter
    const nombre = formData.nombre?.trim() || '';
    if (nombre === '') {
      camposInvalidos.add('nombre');
    }
    
    // Validar precio - debe ser mayor que 0
    const precio = Number(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      camposInvalidos.add('precio');
    }
    
    // Validar stock - debe ser un número válido >= 0
    const stock = Number(formData.stock);
    if (isNaN(stock) || stock < 0) {
      camposInvalidos.add('stock');
    }
    
    // Validar stock_minimo - debe ser un número válido >= 0
    const stockMinimo = Number(formData.stock_minimo);
    if (isNaN(stockMinimo) || stockMinimo < 0) {
      camposInvalidos.add('stock_minimo');
    }
    
    // Validar unidad_medida - debe tener un valor
    const unidadMedida = formData.unidad_medida?.trim() || '';
    if (unidadMedida === '') {
      camposInvalidos.add('unidad_medida');
    }
    
    setCamposVacios(camposInvalidos);
    
    if (camposInvalidos.size > 0) {
      const camposFaltantes = Array.from(camposInvalidos).map(campo => {
        const nombres: { [key: string]: string } = {
          'nombre': 'Nombre del Producto',
          'precio': 'Precio',
          'stock': 'Stock Disponible',
          'stock_minimo': 'Stock Mínimo',
          'unidad_medida': 'Unidad de Medida'
        };
        return nombres[campo] || campo;
      }).join(', ');
      
      mostrarToast(`Por favor completa los siguientes campos obligatorios: ${camposFaltantes}`, 'error');
      return false;
    }
    
    return true;
  };

  // Función para verificar si el formulario es válido (para deshabilitar el botón)
  const esFormularioValido = (): boolean => {
    const nombre = formData.nombre?.trim() || '';
    const precio = Number(formData.precio);
    const stock = Number(formData.stock);
    const stockMinimo = Number(formData.stock_minimo);
    const unidadMedida = formData.unidad_medida?.trim() || '';
    
    return (
      nombre !== '' &&
      !isNaN(precio) && precio > 0 &&
      !isNaN(stock) && stock >= 0 &&
      !isNaN(stockMinimo) && stockMinimo >= 0 &&
      unidadMedida !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos antes de continuar
    if (!validarCampos()) {
      // Hacer scroll al primer campo con error
      const primerCampoError = Array.from(camposVacios)[0];
      if (primerCampoError) {
        const campoElement = document.querySelector(`input[name="${primerCampoError}"], select[name="${primerCampoError}"]`) as HTMLElement;
        if (!campoElement) {
          // Buscar por clase si no se encuentra por name
          const campoPorClase = document.querySelector(`.form-input.placeholder-error`) as HTMLElement;
          if (campoPorClase) {
            campoPorClase.scrollIntoView({ behavior: 'smooth', block: 'center' });
            campoPorClase.focus();
          }
        } else {
          campoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          campoElement.focus();
        }
      }
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
            // No invalidar queries aquí para evitar recargas mientras el formulario está abierto
            mostrarToast('Imagen actualizada exitosamente', 'success');
            onSuccess();
            return;
          }
        } catch (error) {
          console.error('Error subiendo imagen:', error);
          // Si falla, continuar con el flujo normal de actualización
        }
      }
      
      // Asegurarse de que todos los valores sean válidos antes de enviar
      const precio = Number(formData.precio);
      const stock = Number(formData.stock);
      const stockMinimo = Number(formData.stock_minimo);
      
      if (isNaN(precio) || precio <= 0) {
        mostrarToast('El precio debe ser mayor que 0', 'error');
        return;
      }
      
      if (isNaN(stock) || stock < 0) {
        mostrarToast('El stock debe ser un número válido mayor o igual a 0', 'error');
        return;
      }
      
      if (isNaN(stockMinimo) || stockMinimo < 0) {
        mostrarToast('El stock mínimo debe ser un número válido mayor o igual a 0', 'error');
        return;
      }
      
      const productoData: any = {
        nombre: formData.nombre?.trim(),
        descripcion: formData.descripcion?.trim() || null,
        precio: precio,
        stock: stock,
        stock_minimo: stockMinimo,
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
        
        // Subir imagen principal ANTES de navegar (si hay imagen)
        if (imagenFile && productoIdFinal) {
          try {
            console.log('Subiendo imagen principal para producto:', productoIdFinal);
            const imagenResponse = await productosService.subirImagenProducto(productoIdFinal, imagenFile);
            if (imagenResponse.success) {
              console.log('Imagen principal subida exitosamente');
              // Invalidar queries para que se actualicen (se refetchearán después del submit)
              queryClient.invalidateQueries({ 
                queryKey: ['productos', 'productor']
              });
              queryClient.invalidateQueries({ 
                queryKey: ['productos']
              });
            } else {
              console.warn('Error subiendo imagen principal:', imagenResponse);
            }
          } catch (error) {
            console.error('Error subiendo imagen principal:', error);
            // Continuar aunque falle la subida de imagen
          }
        } else if (imagenFile && !productoIdFinal) {
          console.warn('No se pudo subir la imagen porque no se obtuvo el ID del producto');
        }

        // Subir imágenes adicionales ANTES de navegar (si hay imágenes)
        if (imagenesAdicionalesFiles.length > 0 && productoIdFinal) {
          try {
            setSubiendoImagenes(true);
            const responses = await Promise.all(
              imagenesAdicionalesFiles.map(file => 
                productosService.subirImagenAdicional(productoIdFinal, file)
              )
            );
            const exitosas = responses.filter(r => r.success).length;
            console.log(`${exitosas} imagen(es) adicional(es) subida(s) exitosamente`);
            setImagenesAdicionalesFiles([]);
            // Invalidar queries para que se actualicen (se refetchearán después del submit)
            queryClient.invalidateQueries({ 
              queryKey: ['productos', 'productor']
            });
            queryClient.invalidateQueries({ 
              queryKey: ['productos']
            });
          } catch (error) {
            console.error('Error subiendo imágenes adicionales:', error);
            // Continuar aunque falle la subida de imágenes adicionales
          } finally {
            setSubiendoImagenes(false);
          }
        }
        
        // Mostrar mensaje de éxito
        mostrarToast(
          productoId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
          'success'
        );
        
        // Limpiar el estado guardado antes de navegar
        sessionStorage.removeItem('productoFormData');
        preventResetRef.current = false;
        
        // Llamar onSuccess para navegar (después de subir las imágenes)
        onSuccess();
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
        <Button variant="secondary" onClick={() => {
          sessionStorage.removeItem('productoFormData');
          onClose();
        }}>
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
              onChange={(e) => {
                setFormData({ ...formData, nombre: e.target.value });
                // Remover del conjunto de campos vacíos si tiene valor
                if (e.target.value.trim() !== '') {
                  setCamposVacios(prev => {
                    const nuevo = new Set(prev);
                    nuevo.delete('nombre');
                    return nuevo;
                  });
                }
              }}
              placeholder="Ej: Tomates orgánicos"
              required
              className={`form-input ${camposVacios.has('nombre') ? 'placeholder-error' : ''}`}
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
                value={formData.precio !== undefined ? formData.precio : ''}
                onChange={(e) => {
                  const valorStr = e.target.value;
                  const valor = valorStr === '' ? undefined : parseFloat(valorStr);
                  setFormData({ ...formData, precio: valor });
                  // Remover del conjunto de campos vacíos si tiene valor válido
                  if (valor !== undefined && !isNaN(valor) && valor > 0) {
                    setCamposVacios(prev => {
                      const nuevo = new Set(prev);
                      nuevo.delete('precio');
                      return nuevo;
                    });
                  } else {
                    setCamposVacios(prev => {
                      const nuevo = new Set(prev);
                      nuevo.add('precio');
                      return nuevo;
                    });
                  }
                }}
                placeholder="0"
                min="0"
                step="100"
                required
                className={`form-input ${camposVacios.has('precio') ? 'placeholder-error' : ''}`}
              />
            </div>

            <div className="form-group">
              <label>Unidad de Medida *</label>
              <select
                value={formData.unidad_medida || 'kg'}
                onChange={(e) => {
                  setFormData({ ...formData, unidad_medida: e.target.value });
                  // Remover del conjunto de campos vacíos si tiene valor
                  if (e.target.value) {
                    setCamposVacios(prev => {
                      const nuevo = new Set(prev);
                      nuevo.delete('unidad_medida');
                      return nuevo;
                    });
                  }
                }}
                required
                className={camposVacios.has('unidad_medida') ? 'placeholder-error' : ''}
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
                value={formData.stock !== undefined ? formData.stock : ''}
                onChange={(e) => {
                  const valorStr = e.target.value;
                  const valor = valorStr === '' ? undefined : parseInt(valorStr);
                  setFormData({ ...formData, stock: valor });
                  // Remover del conjunto de campos vacíos si tiene valor válido
                  if (valor !== undefined && !isNaN(valor) && valor >= 0) {
                    setCamposVacios(prev => {
                      const nuevo = new Set(prev);
                      nuevo.delete('stock');
                      return nuevo;
                    });
                  } else {
                    setCamposVacios(prev => {
                      const nuevo = new Set(prev);
                      nuevo.add('stock');
                      return nuevo;
                    });
                  }
                }}
                placeholder="0"
                min="0"
                required
                className={`form-input ${camposVacios.has('stock') ? 'placeholder-error' : ''}`}
              />
            </div>

            <div className="form-group">
              <label>Stock Mínimo *</label>
              <input
                type="number"
                value={formData.stock_minimo || 5}
                onChange={(e) => {
                  const valor = parseInt(e.target.value) || 5;
                  setFormData({ ...formData, stock_minimo: valor });
                  // Remover del conjunto de campos vacíos si tiene valor válido
                  if (valor >= 0) {
                    setCamposVacios(prev => {
                      const nuevo = new Set(prev);
                      nuevo.delete('stock_minimo');
                      return nuevo;
                    });
                  }
                }}
                placeholder="5"
                min="0"
                required
                className={`form-input ${camposVacios.has('stock_minimo') ? 'placeholder-error' : ''}`}
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
            onClick={() => {
              sessionStorage.removeItem('productoFormData');
              onClose();
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            loading={saving}
            disabled={!esFormularioValido() && !productoId}
            title={!esFormularioValido() && !productoId ? 'Completa todos los campos obligatorios para crear el producto' : ''}
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
}, (prevProps, nextProps) => {
  // Solo re-renderizar si productoId cambia, no si las funciones cambian
  return prevProps.productoId === nextProps.productoId;
});

