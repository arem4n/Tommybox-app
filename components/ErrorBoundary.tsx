import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.operationType) {
            errorDetails = parsed;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h2>
            <p className="text-gray-600 mb-6">Ha ocurrido un error inesperado. Por favor, intenta recargar la página.</p>
            
            {errorDetails && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 text-sm text-red-800 overflow-auto">
                <p className="font-bold mb-2">Detalles del error de base de datos:</p>
                <p><strong>Operación:</strong> {errorDetails.operationType}</p>
                <p><strong>Ruta:</strong> {errorDetails.path}</p>
                <p><strong>Mensaje:</strong> {errorDetails.error}</p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
