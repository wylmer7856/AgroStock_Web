// 🧩 COMPONENTES REUTILIZABLES

import React from 'react';
import { createPortal } from 'react-dom';
import './ReusableComponents.css';

// ===== TIPOS =====
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
}

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

// ===== COMPONENTE BUTTON =====
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const widthClasses = fullWidth ? 'btn-full-width' : '';
  const loadingClasses = loading ? 'btn-loading' : '';
  const disabledClasses = disabled || loading ? 'btn-disabled' : '';

  const allClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClasses,
    loadingClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="btn-spinner" />
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// ===== COMPONENTE INPUT =====
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const inputClasses = [
    'input',
    error ? 'input-error' : '',
    icon ? `input-with-icon input-icon-${iconPosition}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && iconPosition === 'left' && (
          <span className="input-icon-left">{icon}</span>
        )}
        <input className={inputClasses} {...props} />
        {icon && iconPosition === 'right' && (
          <span className="input-icon-right">{icon}</span>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};

// ===== COMPONENTE CARD =====
export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  loading = false
}) => {
  const cardClasses = ['card', className].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div className="card-title-section">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-content">
        {loading ? <div className="card-loading" /> : children}
      </div>
    </div>
  );
};

// ===== COMPONENTE MODAL =====
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true
}) => {
  React.useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalClasses = ['modal', `modal-${size}`].join(' ');

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Renderizar el modal directamente en el body usando portal
  const modalContent = (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        opacity: 1,
        visibility: 'visible'
      }}
    >
      <div 
        className={modalClasses} 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 100000,
          opacity: 1,
          visibility: 'visible',
          display: 'block',
          margin: 'auto'
        }}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h2 className="modal-title">
                {typeof title === 'string' ? title : title}
              </h2>
            )}
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );

  // Usar createPortal para renderizar el modal directamente en el body
  // Esto evita problemas con overflow y z-index de contenedores padres
  if (typeof document !== 'undefined' && document.body) {
    console.log('[Modal] Renderizando modal con portal, isOpen:', isOpen, 'title:', title);
    try {
      return createPortal(modalContent, document.body);
    } catch (error) {
      console.error('[Modal] Error al crear portal:', error);
      return modalContent;
    }
  }

  console.log('[Modal] Renderizando modal sin portal (SSR o document.body no disponible)');
  return modalContent;
};

// ===== COMPONENTE LOADING =====
export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  text,
  overlay = false
}) => {
  const loadingClasses = ['loading', `loading-${size}`].join(' ');

  const content = (
    <div className={loadingClasses}>
      <div className="loading-spinner" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

// ===== COMPONENTE TOAST =====
export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const toastClasses = ['toast', `toast-${type}`].join(' ');
  
  const icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={toastClasses}>
      <div className="toast-icon">{icons[type] || 'ℹ️'}</div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  );
};

// ===== COMPONENTE BADGE =====
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  className = ''
}) => {
  const badgeClasses = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    className
  ].filter(Boolean).join(' ');

  return <span className={badgeClasses}>{children}</span>;
};

// ===== COMPONENTE AVATAR =====
interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'medium',
  className = ''
}) => {
  const avatarClasses = [
    'avatar',
    `avatar-${size}`,
    className
  ].filter(Boolean).join(' ');

  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={avatarClasses}>
      {src ? (
        <img src={src} alt={alt || name} className="avatar-image" />
      ) : (
        <div className="avatar-placeholder">
          {initials || '👤'}
        </div>
      )}
    </div>
  );
};

// ===== COMPONENTE DIVIDER =====
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  text?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  text,
  className = ''
}) => {
  const dividerClasses = [
    'divider',
    `divider-${orientation}`,
    className
  ].filter(Boolean).join(' ');

  if (text) {
    return (
      <div className={dividerClasses}>
        <span className="divider-text">{text}</span>
      </div>
    );
  }

  return <div className={dividerClasses} />;
};




