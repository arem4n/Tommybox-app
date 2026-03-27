cat << 'INNER_EOF' > components/ErrorBoundary.tsx
import * as React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
            errorDetails = this.state.error.message;
        }
      } catch (e) {}

      return (
        <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ⚠️
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error inesperado en la aplicación.
              {errorDetails && <span className="block mt-2 text-xs font-mono text-red-500 bg-red-50 p-2 rounded">{errorDetails}</span>}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
            >
              Recargar la página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
INNER_EOF
