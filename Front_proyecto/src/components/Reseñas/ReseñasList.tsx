import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reseñasService } from '../../services/reseñas';
import { BiStar, BiUser } from 'react-icons/bi';
import { format } from 'date-fns';
import type { Resena } from '../../types';
import './ReseñasList.css';

interface ReseñasListProps {
  idProducto: number;
}

const ReseñasList: React.FC<ReseñasListProps> = ({ idProducto }) => {
  // PÚBLICO: Cualquiera puede ver las reseñas, no requiere autenticación
  const { data: reseñasResponse, isLoading, error } = useQuery({
    queryKey: ['reseñas', idProducto],
    queryFn: async () => {
      try {
        const response = await reseñasService.obtenerReseñasPorProducto(idProducto);
        console.log('[ReseñasList] Respuesta completa:', response);
        const data = response.data || { data: [], promedio: 0, total: 0 };
        console.log('[ReseñasList] Data extraída:', data);
        return data;
      } catch (err) {
        console.error('[ReseñasList] Error al obtener reseñas:', err);
        return { data: [], promedio: 0, total: 0 };
      }
    },
    enabled: !!idProducto,
    retry: 1,
    staleTime: 30000, // Cache por 30 segundos
  });

  const reseñas = reseñasResponse?.data || [];
  
  // Calcular promedio y total desde el array si no vienen del backend
  let promedio = reseñasResponse?.promedio || 0;
  let total = reseñasResponse?.total || 0;
  
  // Si hay reseñas pero promedio/total son 0, calcularlos desde el array
  if (reseñas.length > 0 && (promedio === 0 || total === 0)) {
    const sumaCalificaciones = reseñas.reduce((sum: number, r: Resena) => sum + (r.calificacion || 0), 0);
    promedio = sumaCalificaciones / reseñas.length;
    total = reseñas.length;
  }
  
  console.log('[ReseñasList] Reseñas finales:', reseñas.length, 'Promedio:', promedio, 'Total:', total);

  const renderStars = (calificacion: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <BiStar
        key={i}
        className={i < calificacion ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="reseñas-container">
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando reseñas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reseñas-container">
      <div className="reseñas-header mb-4">
        <h3 className="mb-2">
          <BiStar className="me-2" />
          Reseñas y Calificaciones
        </h3>
        {reseñas.length > 0 && (
          <div className="reseñas-summary">
            <div className="promedio-calificacion">
              <span className="promedio-numero">{promedio.toFixed(1)}</span>
              <div className="promedio-stars">
                {renderStars(Math.round(promedio))}
              </div>
              <span className="total-reseñas">({total} {total === 1 ? 'reseña' : 'reseñas'})</span>
            </div>
          </div>
        )}
      </div>

      {reseñas.length === 0 ? (
        <div className="no-reseñas text-center py-5">
          <BiStar className="display-1 text-muted mb-3" />
          <p className="text-muted">Aún no hay reseñas para este producto.</p>
          <p className="text-muted small">Sé el primero en calificar este producto.</p>
        </div>
      ) : (
        <div className="reseñas-list">
          {reseñas.map((reseña: Resena) => (
            <div key={reseña.id_resena} className="reseña-item card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <BiUser className="text-primary" size={24} />
                    <div>
                      <strong className="reseña-usuario">
                        {reseña.nombre_consumidor || 'Usuario Anónimo'}
                      </strong>
                      {reseña.fecha_resena && (
                        <small className="text-muted d-block">
                          {format(new Date(reseña.fecha_resena), 'dd MMM yyyy')}
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="reseña-calificacion">
                    {renderStars(reseña.calificacion)}
                  </div>
                </div>
                {reseña.comentario && (
                  <p className="reseña-comentario mb-0 mt-2">
                    {reseña.comentario}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReseñasList;

