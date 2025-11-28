import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reseñasService } from '../../services/reseñas';
import { BiStar } from 'react-icons/bi';
import './CalificacionProducto.css';

interface CalificacionProductoProps {
  idProducto: number;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const CalificacionProducto: React.FC<CalificacionProductoProps> = ({ 
  idProducto, 
  showText = false,
  size = 'small'
}) => {
  const { data: promedioData, isLoading } = useQuery({
    queryKey: ['promedio-calificacion', idProducto],
    queryFn: async () => {
      const response = await reseñasService.obtenerPromedioCalificacion(idProducto);
      return response.data || { promedio: 0, total: 0 };
    },
    enabled: !!idProducto,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const promedio = promedioData?.promedio || 0;
  const total = promedioData?.total || 0;

  if (isLoading || total === 0) {
    return null;
  }

  const starSize = size === 'small' ? 14 : size === 'medium' ? 16 : 18;
  const roundedPromedio = Math.round(promedio);

  return (
    <div className={`calificacion-producto calificacion-${size}`}>
      <div className="d-flex align-items-center gap-1">
        <div className="calificacion-stars">
          {Array.from({ length: 5 }, (_, i) => (
            <BiStar
              key={i}
              size={starSize}
              className={i < roundedPromedio ? 'star-filled' : 'star-empty'}
            />
          ))}
        </div>
        {showText && (
          <span className="calificacion-text">
            {promedio.toFixed(1)} ({total})
          </span>
        )}
      </div>
    </div>
  );
};

export default CalificacionProducto;

