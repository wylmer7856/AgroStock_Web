import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  const variantColors = {
    danger: { bg: '#dc3545', hover: '#bb2d3b' },
    warning: { bg: '#ffc107', hover: '#ffca2c' },
    primary: { bg: '#0d6efd', hover: '#0b5ed7' },
  };

  const colors = variantColors[variant];

  const modalContent = (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 99999,
          opacity: 1
        }}
        onClick={() => {
          if (!isLoading) {
            onClose();
          }
        }}
      />
      
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,
          width: '90%',
          maxWidth: '500px',
          opacity: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{ 
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            opacity: 1
          }}>
          
          {/* HEADER con color según variante */}
          <div 
            style={{ 
              backgroundColor: colors.bg,
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <h5 
              style={{ 
                color: '#ffffff', 
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: 0
              }}
            >
              {title}
            </h5>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Cerrar"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>

          <div 
            style={{ 
              backgroundColor: '#ffffff',
              padding: '32px 24px',
              opacity: 1
            }}>
            <p 
              style={{ 
                fontSize: '1.125rem', 
                color: '#1f2937', 
                lineHeight: '1.75',
                margin: 0,
                fontWeight: 500
              }}
            >
              {message}
            </p>
          </div>

          <div 
            style={{ 
              backgroundColor: '#f9fafb',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #e5e7eb'
            }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{ 
                backgroundColor: '#6b7280',
                color: '#ffffff',
                fontWeight: 600,
                padding: '12px 24px',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              style={{ 
                backgroundColor: colors.bg,
                color: '#ffffff',
                fontWeight: 600,
                padding: '12px 24px',
                fontSize: '1rem',
                minWidth: '140px',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = colors.hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg;
              }}
            >
              {isLoading ? (
                <>
                  <span 
                    className="spinner-border spinner-border-sm" 
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <span>Procesando...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;