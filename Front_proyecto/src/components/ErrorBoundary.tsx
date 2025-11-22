import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error capturado por ErrorBoundary:', error);
    console.error('📋 Error Info:', errorInfo);
    console.error('📍 Component Stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const errorInfo = this.state.errorInfo;
      
      return (
        <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh', padding: '20px' }}>
          <div className="text-center p-5 bg-white rounded shadow" style={{ maxWidth: '800px', width: '100%' }}>
            <h1 className="text-danger mb-4" style={{ fontSize: '2.5rem' }}>⚠️ Error en la aplicación</h1>
            <p className="text-muted mb-3" style={{ fontSize: '1.1rem' }}>
              {error?.message || 'Ha ocurrido un error inesperado'}
            </p>
            
            {error?.name && (
              <p className="text-secondary mb-4">
                <strong>Tipo de error:</strong> {error.name}
              </p>
            )}
            
            <div className="d-flex gap-2 justify-content-center mb-4">
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
              >
                Recargar página
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
              >
                Limpiar y reiniciar
              </button>
            </div>
            
            <details className="mt-4 text-start">
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                🔍 Detalles del error (click para expandir)
              </summary>
              <div className="mt-2 p-3 bg-light rounded" style={{ fontSize: '0.875rem', maxHeight: '400px', overflow: 'auto' }}>
                <div className="mb-3">
                  <strong>Mensaje:</strong>
                  <pre className="mt-1 mb-0 p-2 bg-white rounded" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {error?.message || 'Sin mensaje'}
                  </pre>
                </div>
                
                {error?.stack && (
                  <div className="mb-3">
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 mb-0 p-2 bg-white rounded" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }}>
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 mb-0 p-2 bg-white rounded" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

