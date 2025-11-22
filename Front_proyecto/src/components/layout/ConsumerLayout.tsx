import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from '../Footer';

const ConsumerLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Siempre abierto por defecto
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      const isDesktopSize = window.innerWidth >= 992;
      setIsDesktop(isDesktopSize);
      // En desktop, sidebar siempre abierto y no se puede cerrar
      if (isDesktopSize) {
        setSidebarOpen(true);
      }
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Asegurar que el sidebar esté siempre abierto en desktop
  useEffect(() => {
    if (isDesktop && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [isDesktop, sidebarOpen]);

  const toggleSidebar = () => {
    // Solo permitir cerrar en móvil
    if (window.innerWidth < 992) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  // HomePage ya incluye su propio Footer, no duplicarlo
  const showFooter = location.pathname !== '/';

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div className="d-flex flex-grow-1" style={{ marginTop: '56px' }}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => {
            // Solo cerrar en móvil
            if (window.innerWidth < 992) {
              setSidebarOpen(false);
            }
          }} 
        />
        
        <main 
          className="flex-grow-1 p-4"
          style={{ 
            marginLeft: isDesktop && sidebarOpen ? '280px' : '0',
            transition: 'margin-left 0.3s ease-in-out',
            width: isDesktop && sidebarOpen ? 'calc(100% - 280px)' : '100%',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Outlet />
        </main>
      </div>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default ConsumerLayout;

