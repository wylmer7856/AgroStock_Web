import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../Footer';

const PublicLayout: React.FC = () => {
  const location = useLocation();
  // HomePage ya incluye su propio Footer, no duplicarlo
  const showFooter = location.pathname !== '/';

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;

