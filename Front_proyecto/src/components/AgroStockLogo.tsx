// 🌾 COMPONENTE DEL LOGO DE AGROSTOCK

import React, { useState } from 'react';
import { getLogoPath, handleImageError, PLACEHOLDER_IMAGES } from '../utils/assets';
import './AgroStockLogo.css';

interface AgroStockLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  onClick?: () => void;
}

export const AgroStockLogo: React.FC<AgroStockLogoProps> = ({
  size = 'medium',
  variant = 'full',
  className = '',
  onClick
}) => {
  const logoClasses = [
    'agrostock-logo',
    `logo-${size}`,
    `logo-${variant}`,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => (
    <div className="logo-icon">
      <div className="planting-person">
        <div className="person-body">
          <div className="person-head">
            <div className="person-hat"></div>
          </div>
          <div className="person-shirt"></div>
        </div>
        <div className="person-arms">
          <div className="left-arm"></div>
          <div className="right-arm"></div>
        </div>
        <div className="seedling">
          <div className="seedling-stem"></div>
          <div className="seedling-leaves">
            <div className="leaf leaf-1"></div>
            <div className="leaf leaf-2"></div>
            <div className="leaf leaf-3"></div>
          </div>
          <div className="seedling-support"></div>
        </div>
        <div className="ground">
          <div className="grass-blade grass-1"></div>
          <div className="grass-blade grass-2"></div>
          <div className="grass-blade grass-3"></div>
        </div>
        <div className="sky">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="sun"></div>
        </div>
      </div>
    </div>
  );

  const renderText = () => (
    <div className="logo-text">
      <span className="brand-name">AGROSTOCK</span>
    </div>
  );

  return (
    <div 
      className={logoClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {variant === 'icon' && renderIcon()}
      {variant === 'text' && renderText()}
      {variant === 'full' && (
        <>
          {renderIcon()}
          {renderText()}
        </>
      )}
    </div>
  );
};

export default AgroStockLogo;




