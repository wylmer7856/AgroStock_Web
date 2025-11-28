import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reseñasService } from '../../services/reseñas';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiStar, BiX } from 'react-icons/bi';
import './AgregarReseña.css';

interface AgregarReseñaProps {
  idProducto: number;
  idProductor?: number; // Opcional - se obtiene del producto si no se proporciona
  idPedido?: number; // Opcional - cualquier usuario puede reseñar
  onClose: () => void;
  onSuccess?: () => void;
}

const AgregarReseña: React.FC<AgregarReseñaProps> = ({
  idProducto,
  idProductor,
  idPedido,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [calificacion, setCalificacion] = useState(0);
  const [hoverCalificacion, setHoverCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');

  const crearReseñaMutation = useMutation({
    mutationFn: async (data: {
      id_pedido?: number | null;
      id_producto: number;
      id_productor?: number;
      calificacion: number;
      comentario?: string | null;
    }) => {
      return await reseñasService.crearReseña(data);
    },
    onSuccess: async () => {
      // Invalidar y refetch todas las queries relacionadas con reseñas
      await queryClient.invalidateQueries({ queryKey: ['reseñas', idProducto] });
      await queryClient.invalidateQueries({ queryKey: ['ya-reseñado'] });
      await queryClient.invalidateQueries({ queryKey: ['productos'] }); // Para actualizar calificaciones en listados
      
      // Forzar refetch de las reseñas
      await queryClient.refetchQueries({ queryKey: ['reseñas', idProducto] });
      
      console.log('[AgregarReseña] Reseña agregada, queries invalidadas y refetch ejecutado');
      toast.success('¡Reseña agregada exitosamente!');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error al crear reseña:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al agregar la reseña';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (calificacion === 0) {
      toast.error('Por favor, selecciona una calificación');
      return;
    }

    if (!user?.id_usuario) {
      toast.error('Debes estar autenticado para agregar una reseña');
      return;
    }

    // Preparar datos para enviar - solo campos requeridos y opcionales con valor
    const datosReseña: {
      id_producto: number;
      calificacion: number;
      id_pedido?: number;
      id_productor?: number;
      comentario?: string;
    } = {
      id_producto: idProducto,
      calificacion: Math.round(calificacion), // Asegurar que sea entero
    };

    // Solo incluir campos opcionales si tienen valor
    if (idPedido && idPedido > 0) {
      datosReseña.id_pedido = idPedido;
    }
    
    if (idProductor && idProductor > 0) {
      datosReseña.id_productor = idProductor;
    }
    
    if (comentario && comentario.trim()) {
      datosReseña.comentario = comentario.trim();
    }

    console.log('Enviando datos de reseña:', datosReseña);

    crearReseñaMutation.mutate(datosReseña);
  };

  const renderStars = (value: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= (hoverCalificacion || calificacion);
      
      return (
        <button
          key={i}
          type="button"
          className={`star-button ${interactive ? 'interactive' : ''} ${isFilled ? 'filled' : ''}`}
          onClick={() => interactive && setCalificacion(starValue)}
          onMouseEnter={() => interactive && setHoverCalificacion(starValue)}
          onMouseLeave={() => interactive && setHoverCalificacion(0)}
          disabled={!interactive || crearReseñaMutation.isPending}
        >
          <BiStar size={32} />
        </button>
      );
    });
  };

  return (
    <div className="agregar-reseña-modal">
      <div className="agregar-reseña-content">
        <div className="agregar-reseña-header">
          <h4>Agregar Reseña</h4>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            disabled={crearReseñaMutation.isPending}
          >
            <BiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-bold">Calificación *</label>
            <div className="stars-container">
              {renderStars(calificacion, true)}
            </div>
            {calificacion > 0 && (
              <small className="text-muted d-block mt-2">
                {calificacion === 5 && 'Excelente'}
                {calificacion === 4 && 'Muy bueno'}
                {calificacion === 3 && 'Bueno'}
                {calificacion === 2 && 'Regular'}
                {calificacion === 1 && 'Malo'}
              </small>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="comentario" className="form-label fw-bold">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              className="form-control"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Comparte tu experiencia con este producto..."
              disabled={crearReseñaMutation.isPending}
            />
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={crearReseñaMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={calificacion === 0 || crearReseñaMutation.isPending}
            >
              {crearReseñaMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Guardando...
                </>
              ) : (
                'Publicar Reseña'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarReseña;

