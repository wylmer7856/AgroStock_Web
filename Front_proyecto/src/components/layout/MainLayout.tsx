import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div className="d-flex flex-grow-1" style={{ marginTop: '56px' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main 
          className="flex-grow-1 p-4"
          style={{ 
            marginLeft: isDesktop && sidebarOpen ? '280px' : '0',
            transition: 'margin-left 0.3s ease-in-out',
            width: '100%',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;






