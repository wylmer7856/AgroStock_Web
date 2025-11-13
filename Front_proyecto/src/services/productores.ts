// 🌾 SERVICIO DE PRODUCTORES
import apiService from './api';
import { APP_CONFIG } from '../config';

export interface Productor {
  id_productor?: number;
  id_usuario: number;
  nombre_finca?: string | null;
  tipo_productor?: 'agricultor' | 'ganadero' | 'apicultor' | 'piscicultor' | 'avicultor' | 'mixto' | 'otro';
  id_departamento?: number | null;
  id_ciudad?: number | null;
  vereda?: string | null;
  direccion_finca?: string | null;
  numero_registro_ica?: string | null;
  certificaciones?: string | null;
  descripcion_actividad?: string | null;
  anos_experiencia?: number | null;
  hectareas?: number | null;
  metodo_produccion?: 'tradicional' | 'organico' | 'convencional' | 'mixto';
  redes_sociales?: any | null;
  sitio_web?: string | null;
  foto_perfil_finca?: string | null;
  activo?: boolean;
  // Campos adicionales de la vista
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad_nombre?: string;
  departamento_nombre?: string;
  region_nombre?: string;
  total_productos_activos?: number;
  total_pedidos_recibidos?: number;
}

export interface CrearProductorData {
  nombre_finca?: string;
  tipo_productor?: 'agricultor' | 'ganadero' | 'apicultor' | 'piscicultor' | 'avicultor' | 'mixto' | 'otro';
  id_departamento?: number;
  id_ciudad?: number;
  vereda?: string;
  direccion_finca?: string;
  numero_registro_ica?: string;
  certificaciones?: string;
  descripcion_actividad?: string;
  anos_experiencia?: number;
  hectareas?: number;
  metodo_produccion?: 'tradicional' | 'organico' | 'convencional' | 'mixto';
  redes_sociales?: any;
  sitio_web?: string;
  foto_perfil_finca?: string;
}

const productoresService = {
  // Obtener mi perfil de productor (desde tabla usuarios)
  async obtenerMiPerfil(): Promise<{ success: boolean; data?: Productor; message?: string }> {
    try {
      // Intentar obtener desde endpoint de productores primero
      try {
        const response = await apiService.get('/productores/mi-perfil');
        if (response.success && response.data) {
          return response;
        }
      } catch (error: any) {
        // Si no existe tabla productor, obtener desde usuarios
        console.log('Tabla productor no disponible, obteniendo desde usuarios...');
      }
      
      // Obtener datos del usuario actual (que incluye datos de productor)
      const userResponse = await apiService.get('/auth/verify');
      if (userResponse.success && userResponse.data) {
        const user = userResponse.data;
        // Construir objeto Productor desde datos del usuario
        const productorData: Productor = {
          id_usuario: user.id_usuario || user.id || 0,
          nombre_finca: (user as any).nombre_finca || null,
          tipo_productor: (user as any).tipo_productor || 'agricultor',
          id_departamento: (user as any).id_departamento || null,
          id_ciudad: (user as any).id_ciudad || null,
          vereda: (user as any).vereda || null,
          direccion_finca: (user as any).direccion_finca || null,
          numero_registro_ica: (user as any).numero_registro_ica || null,
          certificaciones: (user as any).certificaciones || null,
          descripcion_actividad: (user as any).descripcion_actividad || null,
          anos_experiencia: (user as any).anos_experiencia || null,
          hectareas: (user as any).hectareas || null,
          metodo_produccion: (user as any).metodo_produccion || 'tradicional',
          sitio_web: (user as any).sitio_web || null,
          foto_perfil_finca: (user as any).foto_perfil_finca || null,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          direccion: user.direccion,
        };
        
        return {
          success: true,
          data: productorData
        };
      }
      
      return {
        success: false,
        message: 'No se encontró perfil. Puedes crear uno nuevo.'
      };
    } catch (error: any) {
      console.error('Error obteniendo mi perfil:', error);
      return {
        success: false,
        message: error.message || error.response?.data?.message || 'Error al obtener tu perfil'
      };
    }
  },

  // Obtener perfil de productor por ID de usuario
  async obtenerPorUsuario(idUsuario: number): Promise<{ success: boolean; data?: Productor; message?: string }> {
    try {
      const response = await apiService.get(`/productores/usuario/${idUsuario}`);
      return response;
    } catch (error: any) {
      console.error('Error obteniendo perfil de productor:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener perfil de productor'
      };
    }
  },

  // Listar todos los productores
  async listarProductores(filtros?: {
    tipo_productor?: string;
    departamento?: number;
    ciudad?: number;
    nombre_finca?: string;
    certificaciones?: string;
  }): Promise<{ success: boolean; data?: Productor[]; message?: string; total?: number }> {
    try {
      const params = new URLSearchParams();
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const queryString = params.toString();
      const url = queryString ? `/productores?${queryString}` : '/productores';
      const response = await apiService.get(url);
      return response;
    } catch (error: any) {
      console.error('Error listando productores:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al listar productores'
      };
    }
  },

  // Crear o actualizar perfil de productor (en tabla usuarios)
  async guardarPerfil(datos: CrearProductorData): Promise<{ success: boolean; data?: Productor; message?: string }> {
    try {
      // Intentar guardar en tabla productor primero
      try {
        const response = await apiService.post('/productores', datos);
        if (response.success && response.data) {
          return response;
        }
      } catch (error: any) {
        // Si no existe tabla productor, guardar en usuarios
        console.log('Tabla productor no disponible, guardando en usuarios...');
      }
      
      // Obtener ID del usuario actual
      const userData = localStorage.getItem(APP_CONFIG.AUTH.USER_KEY);
      
      if (!userData) {
        // Intentar obtener desde el endpoint de verificación
        const verifyResponse = await apiService.get('/auth/verify');
        if (verifyResponse.success && verifyResponse.data) {
          const user = verifyResponse.data;
          const idUsuario = user.id_usuario || user.id;
          
          if (!idUsuario) {
            throw new Error('No se encontró ID de usuario');
          }
          
          // Guardar datos del productor como parte del usuario
          const datosUsuario = {
            nombre_finca: datos.nombre_finca || null,
            tipo_productor: datos.tipo_productor || 'agricultor',
            id_departamento: datos.id_departamento || null,
            id_ciudad: datos.id_ciudad || null,
            vereda: datos.vereda || null,
            direccion_finca: datos.direccion_finca || null,
            numero_registro_ica: datos.numero_registro_ica || null,
            certificaciones: datos.certificaciones || null,
            descripcion_actividad: datos.descripcion_actividad || null,
            anos_experiencia: datos.anos_experiencia || null,
            hectareas: datos.hectareas || null,
            metodo_produccion: datos.metodo_produccion || 'tradicional',
            sitio_web: datos.sitio_web || null,
            foto_perfil_finca: datos.foto_perfil_finca || null,
          };
          
          const response = await apiService.put(`/Usuario/${idUsuario}`, datosUsuario);
          
          if (response.success && response.data) {
            const updatedUser = response.data;
            const productorData: Productor = {
              id_usuario: updatedUser.id_usuario || updatedUser.id || idUsuario,
              nombre_finca: updatedUser.nombre_finca || null,
              tipo_productor: updatedUser.tipo_productor || 'agricultor',
              id_departamento: updatedUser.id_departamento || null,
              id_ciudad: updatedUser.id_ciudad || null,
              vereda: updatedUser.vereda || null,
              direccion_finca: updatedUser.direccion_finca || null,
              numero_registro_ica: updatedUser.numero_registro_ica || null,
              certificaciones: updatedUser.certificaciones || null,
              descripcion_actividad: updatedUser.descripcion_actividad || null,
              anos_experiencia: updatedUser.anos_experiencia || null,
              hectareas: updatedUser.hectareas || null,
              metodo_produccion: updatedUser.metodo_produccion || 'tradicional',
              sitio_web: updatedUser.sitio_web || null,
              foto_perfil_finca: updatedUser.foto_perfil_finca || null,
              nombre: updatedUser.nombre,
              email: updatedUser.email,
              telefono: updatedUser.telefono,
              direccion: updatedUser.direccion,
            };
            
            return {
              success: true,
              data: productorData
            };
          }
          
          return {
            success: false,
            message: response.message || 'Error al guardar perfil'
          };
        }
        
        throw new Error('No se encontró información del usuario');
      }
      
      const user = JSON.parse(userData);
      const idUsuario = user.id_usuario || user.id;
      
      if (!idUsuario) {
        throw new Error('No se encontró ID de usuario');
      }
      
      // Guardar datos del productor como parte del usuario
      const datosUsuario = {
        nombre_finca: datos.nombre_finca || null,
        tipo_productor: datos.tipo_productor || 'agricultor',
        id_departamento: datos.id_departamento || null,
        id_ciudad: datos.id_ciudad || null,
        vereda: datos.vereda || null,
        direccion_finca: datos.direccion_finca || null,
        numero_registro_ica: datos.numero_registro_ica || null,
        certificaciones: datos.certificaciones || null,
        descripcion_actividad: datos.descripcion_actividad || null,
        anos_experiencia: datos.anos_experiencia || null,
        hectareas: datos.hectareas || null,
        metodo_produccion: datos.metodo_produccion || 'tradicional',
        sitio_web: datos.sitio_web || null,
        foto_perfil_finca: datos.foto_perfil_finca || null,
      };
      
      const response = await apiService.put(`/Usuario/${idUsuario}`, datosUsuario);
      
      if (response.success && response.data) {
        // Construir objeto Productor desde respuesta
        const updatedUser = response.data;
        const productorData: Productor = {
          id_usuario: updatedUser.id_usuario || updatedUser.id || idUsuario,
          nombre_finca: updatedUser.nombre_finca || null,
          tipo_productor: updatedUser.tipo_productor || 'agricultor',
          id_departamento: updatedUser.id_departamento || null,
          id_ciudad: updatedUser.id_ciudad || null,
          vereda: updatedUser.vereda || null,
          direccion_finca: updatedUser.direccion_finca || null,
          numero_registro_ica: updatedUser.numero_registro_ica || null,
          certificaciones: updatedUser.certificaciones || null,
          descripcion_actividad: updatedUser.descripcion_actividad || null,
          anos_experiencia: updatedUser.anos_experiencia || null,
          hectareas: updatedUser.hectareas || null,
          metodo_produccion: updatedUser.metodo_produccion || 'tradicional',
          sitio_web: updatedUser.sitio_web || null,
          foto_perfil_finca: updatedUser.foto_perfil_finca || null,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          telefono: updatedUser.telefono,
          direccion: updatedUser.direccion,
        };
        
        return {
          success: true,
          data: productorData
        };
      }
      
      return {
        success: false,
        message: response.message || 'Error al guardar perfil'
      };
    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al guardar perfil'
      };
    }
  },

  // Actualizar perfil de productor
  async actualizarPerfil(idProductor: number, datos: Partial<CrearProductorData>): Promise<{ success: boolean; data?: Productor; message?: string }> {
    try {
      const response = await apiService.put(`/productores/${idProductor}`, datos);
      return response;
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar perfil'
      };
    }
  }
};

export default productoresService;

