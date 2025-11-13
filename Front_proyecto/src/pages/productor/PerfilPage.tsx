// 🌾 PÁGINA DE PERFIL DE PRODUCTOR

import React from 'react';
import { Link } from 'react-router-dom';
import { PerfilProductor } from '../../Screens/PRODUCTOR/PerfilProductor';

const PerfilPage: React.FC = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row mb-3">
        <div className="col-12">
          <Link to="/productor/dashboard" className="btn btn-outline-secondary mb-3">
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
      <PerfilProductor />
    </div>
  );
};

export default PerfilPage;

