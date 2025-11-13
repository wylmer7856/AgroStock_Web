// 🌍 SERVICIO DE UBICACIONES (Regiones, Departamentos, Ciudades)

import apiService from './api';
import type { 
  Region, 
  Departamento, 
  Ciudad,
  ApiResponse 
} from '../types';

class UbicacionesService {
  
  // ===== REGIONES =====
  async listarRegiones(): Promise<ApiResponse<Region[]>> {
    try {
      const response = await apiService.get<Region[]>('/regiones');
      return response;
    } catch (error) {
      console.error('Error listando regiones:', error);
      throw error;
    }
  }

  // ===== DEPARTAMENTOS =====
  async listarDepartamentos(idRegion?: number): Promise<ApiResponse<Departamento[]>> {
    try {
      const endpoint = idRegion ? `/departamentos?id_region=${idRegion}` : '/departamentos';
      const response = await apiService.get<Departamento[]>(endpoint);
      return response;
    } catch (error) {
      console.error('Error listando departamentos:', error);
      throw error;
    }
  }

  // ===== CIUDADES =====
  async listarCiudades(idDepartamento?: number): Promise<ApiResponse<Ciudad[]>> {
    try {
      const endpoint = idDepartamento ? `/ciudades?id_departamento=${idDepartamento}` : '/ciudades';
      const response = await apiService.get<Ciudad[]>(endpoint);
      return response;
    } catch (error) {
      console.error('Error listando ciudades:', error);
      throw error;
    }
  }

  // ===== OBTENER CIUDAD POR ID =====
  async obtenerCiudad(idCiudad: number): Promise<ApiResponse<Ciudad>> {
    try {
      const response = await apiService.get<Ciudad>(`/ciudades/${idCiudad}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo ciudad:', error);
      throw error;
    }
  }

  // ===== OBTENER UBICACIÓN COMPLETA =====
  async obtenerUbicacionCompleta(idCiudad: number): Promise<ApiResponse<{
    ciudad: Ciudad;
    departamento: Departamento;
    region: Region;
  }>> {
    try {
      const response = await apiService.get<{
        ciudad: Ciudad;
        departamento: Departamento;
        region: Region;
      }>(`/ciudades/${idCiudad}/completa`);
      return response;
    } catch (error) {
      console.error('Error obteniendo ubicación completa:', error);
      throw error;
    }
  }
}

export const ubicacionesService = new UbicacionesService();
export default ubicacionesService;


