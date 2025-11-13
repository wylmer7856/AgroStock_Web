// 💬 SERVICIO DE MENSAJES

import apiService from './api';
import type { 
  Mensaje,
  ApiResponse 
} from '../types';

class MensajesService {
  
  // ===== ENVIAR MENSAJE =====
  async enviarMensaje(mensajeData: {
    id_destinatario: number;
    id_producto?: number;
    asunto: string;
    mensaje: string;
    tipo_mensaje?: 'consulta' | 'pedido' | 'general';
  }): Promise<ApiResponse<Mensaje>> {
    try {
      console.log('📤 [MensajesService] Enviando mensaje:', {
        id_destinatario: mensajeData.id_destinatario,
        asunto: mensajeData.asunto,
        mensaje: mensajeData.mensaje.substring(0, 50) + '...',
        tipo_mensaje: mensajeData.tipo_mensaje
      });
      
      const response = await apiService.post<Mensaje>(
        `/mensajes/enviar`,
        mensajeData
      );
      
      console.log('📥 [MensajesService] Respuesta recibida:', {
        success: response.success,
        message: response.message,
        data: response.data ? 'Presente' : 'Ausente',
        fullResponse: response
      });
      
      return response;
    } catch (error: any) {
      console.error('❌ [MensajesService] Error enviando mensaje:', error);
      console.error('   Error completo:', JSON.stringify(error, null, 2));
      console.error('   Error message:', error?.message);
      console.error('   Error stack:', error?.stack);
      throw error;
    }
  }

  // ===== OBTENER MENSAJES RECIBIDOS =====
  async obtenerMensajesRecibidos(): Promise<ApiResponse<Mensaje[]>> {
    try {
      console.log('📞 Llamando a /mensajes/recibidos');
      const response = await apiService.get<any>(
        `/mensajes/recibidos`
      );
      console.log('📥 Respuesta raw de API:', JSON.stringify(response, null, 2));
      
      // El backend devuelve { success: true, mensajes: [...], total: ... }
      // El apiService normaliza mensajes a data, pero verificar ambos
      if (response) {
        // Primero verificar si tiene data (normalizado por apiService)
        if (response.data && Array.isArray(response.data)) {
          console.log('✅ Usando response.data:', response.data.length);
          return {
            success: true,
            data: response.data,
            message: response.message || 'Mensajes obtenidos correctamente'
          };
        }
        
        // Si no tiene data, verificar mensajes directamente
        if (response.mensajes && Array.isArray(response.mensajes)) {
          console.log('✅ Usando response.mensajes:', response.mensajes.length);
          return {
            success: true,
            data: response.mensajes,
            message: response.message || 'Mensajes obtenidos correctamente'
          };
        }
        
        // Si es un array directo
        if (Array.isArray(response)) {
          console.log('✅ Response es array directo:', response.length);
          return {
            success: true,
            data: response,
            message: 'Mensajes obtenidos correctamente'
          };
        }
      }
      
      // Si no hay datos, devolver array vacío
      console.warn('⚠️ No se encontraron mensajes en la respuesta');
      return {
        success: true,
        data: [],
        message: response?.message || 'No hay mensajes'
      };
    } catch (error: any) {
      console.error('❌ Error obteniendo mensajes recibidos:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      // Si es un error 405, puede ser que la ruta no exista
      if (error?.message?.includes('405') || error?.message?.includes('Method Not Allowed')) {
        console.warn('⚠️ Ruta /mensajes/recibidos no disponible. Verifica el backend.');
        return {
          success: false,
          data: [],
          message: 'La ruta de mensajes no está disponible. Verifica el backend.'
        };
      }
      throw error;
    }
  }

  // ===== OBTENER MENSAJES ENVIADOS =====
  async obtenerMensajesEnviados(): Promise<ApiResponse<Mensaje[]>> {
    try {
      console.log('📞 Llamando a /mensajes/enviados');
      const response = await apiService.get<any>(
        `/mensajes/enviados`
      );
      console.log('📥 Respuesta raw de API:', JSON.stringify(response, null, 2));
      
      // El backend devuelve { success: true, mensajes: [...], total: ... }
      // El apiService normaliza mensajes a data, pero verificar ambos
      if (response) {
        // Primero verificar si tiene data (normalizado por apiService)
        if (response.data && Array.isArray(response.data)) {
          console.log('✅ Usando response.data:', response.data.length);
          return {
            success: true,
            data: response.data,
            message: response.message || 'Mensajes obtenidos correctamente'
          };
        }
        
        // Si no tiene data, verificar mensajes directamente
        if (response.mensajes && Array.isArray(response.mensajes)) {
          console.log('✅ Usando response.mensajes:', response.mensajes.length);
          return {
            success: true,
            data: response.mensajes,
            message: response.message || 'Mensajes obtenidos correctamente'
          };
        }
        
        // Si es un array directo
        if (Array.isArray(response)) {
          console.log('✅ Response es array directo:', response.length);
          return {
            success: true,
            data: response,
            message: 'Mensajes obtenidos correctamente'
          };
        }
      }
      
      // Si no hay datos, devolver array vacío
      console.warn('⚠️ No se encontraron mensajes en la respuesta');
      return {
        success: true,
        data: [],
        message: response?.message || 'No hay mensajes'
      };
    } catch (error: any) {
      console.error('❌ Error obteniendo mensajes enviados:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      // Si es un error 405, puede ser que la ruta no exista
      if (error?.message?.includes('405') || error?.message?.includes('Method Not Allowed')) {
        console.warn('⚠️ Ruta /mensajes/enviados no disponible. Verifica el backend.');
        return {
          success: false,
          data: [],
          message: 'La ruta de mensajes no está disponible. Verifica el backend.'
        };
      }
      throw error;
    }
  }

  // ===== MARCAR MENSAJE COMO LEÍDO =====
  async marcarComoLeido(id_mensaje: number): Promise<ApiResponse> {
    try {
      const response = await apiService.put(
        `/mensajes/${id_mensaje}/leer`,
        {}
      );
      return response;
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
      throw error;
    }
  }

  // ===== ELIMINAR MENSAJE =====
  async eliminarMensaje(id_mensaje: number): Promise<ApiResponse> {
    try {
      const response = await apiService.delete(
        `/mensajes/${id_mensaje}`
      );
      return response;
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      throw error;
    }
  }

  // ===== OBTENER MENSAJES NO LEÍDOS =====
  async obtenerMensajesNoLeidos(): Promise<ApiResponse<{ total_no_leidos: number }>> {
    try {
      const response = await apiService.get<{ total_no_leidos: number }>(
        `/mensajes/no-leidos`
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo mensajes no leídos:', error);
      throw error;
    }
  }

  // ===== OBTENER CONVERSACIÓN =====
  async obtenerConversacion(id_usuario: number): Promise<ApiResponse<Mensaje[]>> {
    try {
      const response = await apiService.get<any>(
        `/mensajes/conversacion/${id_usuario}`
      );
      // El backend devuelve { success: true, conversacion: [...], total: ... }
      if (response.success && response.conversacion) {
        return {
          success: true,
          data: response.conversacion,
          message: response.message
        };
      }
      return {
        success: response.success || false,
        data: response.data || response.conversacion || [],
        message: response.message
      };
    } catch (error) {
      console.error('Error obteniendo conversación:', error);
      throw error;
    }
  }

  // ===== CONTACTAR PRODUCTOR (SIN LOGIN) =====
  async contactarProductor(contactoData: {
    id_producto: number;
    nombre_contacto: string;
    email_contacto: string;
    telefono_contacto?: string;
    mensaje: string;
  }): Promise<ApiResponse> {
    try {
      const response = await apiService.post(
        `/mensajes/contactar-productor`,
        contactoData,
        false // No requiere autenticación
      );
      return response;
    } catch (error) {
      console.error('Error contactando productor:', error);
      throw error;
    }
  }
}

export const mensajesService = new MensajesService();
export default mensajesService;

