// Ejemplo de uso completo de los componentes de autenticación
// Este archivo muestra diferentes formas de implementar Login y Registrar

import React, { useState } from 'react';
import Login from './Screens/Auth/Login';
import Registrar from './Screens/Auth/Registrar';

// Tipos para los datos de formulario
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
  aceptaTerminos: boolean;
}

// Ejemplo 1: Uso básico con navegación simple
export const AuthExample1: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');

  return (
    <div className="App">
      {currentView === 'login' ? (
        <Login 
          onLogin={(data) => console.log('Login:', data)}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      ) : (
        <Registrar 
          onRegister={(data) => console.log('Register:', data)}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </div>
  );
};

// Ejemplo 2: Uso con manejo de estado de usuario
export const AuthExample2: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<RegisterFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (formData: LoginFormData) => {
    setIsLoading(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En una aplicación real, aquí harías la llamada a tu API
      console.log('Login exitoso:', formData);
      alert(`¡Bienvenido! Login exitoso para: ${formData.email}`);
      
      // Simular datos de usuario (en la realidad vendrían del servidor)
      setUser({
        nombre: 'Usuario',
        apellido: 'Demo',
        email: formData.email,
        telefono: '+57 300 123 4567',
        password: '',
        confirmPassword: '',
        aceptaTerminos: true
      });
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (formData: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Registro exitoso:', formData);
      alert(`¡Cuenta creada exitosamente! Bienvenido ${formData.nombre} ${formData.apellido}`);
      
      // Cambiar automáticamente a login después del registro exitoso
      setCurrentView('login');
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  // Si el usuario está logueado, mostrar dashboard
  if (user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>¡Bienvenido a AgroStock!</h1>
        <p>Hola, {user.nombre} {user.apellido}</p>
        <p>Email: {user.email}</p>
        <button 
          onClick={() => setUser(null)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            Procesando...
          </div>
        </div>
      )}
      
      {currentView === 'login' ? (
        <Login 
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      ) : (
        <Registrar 
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </div>
  );
};

// Ejemplo 3: Uso con validación personalizada
export const AuthExample3: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [customErrors, setCustomErrors] = useState<string[]>([]);

  const handleLogin = (formData: LoginFormData) => {
    // Validación personalizada adicional
    if (formData.email.includes('admin')) {
      setCustomErrors(['Los administradores deben usar el panel especial']);
      return;
    }
    
    setCustomErrors([]);
    console.log('Login válido:', formData);
    alert('Login exitoso');
  };

  const handleRegister = (formData: RegisterFormData) => {
    // Validación personalizada adicional
    if (formData.telefono.length < 10) {
      setCustomErrors(['El teléfono debe tener al menos 10 dígitos']);
      return;
    }
    
    setCustomErrors([]);
    console.log('Registro válido:', formData);
    alert('Registro exitoso');
    setCurrentView('login');
  };

  return (
    <div className="App">
      {customErrors.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#e74c3c',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          {customErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
      
      {currentView === 'login' ? (
        <Login 
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      ) : (
        <Registrar 
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </div>
  );
};

// Ejemplo 4: Uso con diferentes temas
export const AuthExample4: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [theme, setTheme] = useState<'green' | 'blue' | 'purple'>('green');

  const getThemeStyles = () => {
    const themes = {
      green: { primary: '#4CAF50', secondary: '#45a049' },
      blue: { primary: '#2196F3', secondary: '#1976D2' },
      purple: { primary: '#9C27B0', secondary: '#7B1FA2' }
    };
    
    return themes[theme];
  };

  const currentTheme = getThemeStyles();

  return (
    <div className="App">
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value as any)}
          style={{
            padding: '5px 10px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        >
          <option value="green">Verde</option>
          <option value="blue">Azul</option>
          <option value="purple">Morado</option>
        </select>
      </div>

      <style>{`
        .login-title, .register-title {
          background: linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary}) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }
        .login-button, .register-button {
          background: linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary}) !important;
        }
        .login-button:hover:not(:disabled), .register-button:hover:not(:disabled) {
          box-shadow: 0 10px 20px rgba(${parseInt(currentTheme.primary.slice(1, 3), 16)}, ${parseInt(currentTheme.primary.slice(3, 5), 16)}, ${parseInt(currentTheme.primary.slice(5, 7), 16)}, 0.3) !important;
        }
      `}</style>
      
      {currentView === 'login' ? (
        <Login 
          onLogin={(data) => console.log('Login:', data)}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      ) : (
        <Registrar 
          onRegister={(data) => console.log('Register:', data)}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </div>
  );
};

// CSS para las animaciones
const styles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Agregar estilos al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
