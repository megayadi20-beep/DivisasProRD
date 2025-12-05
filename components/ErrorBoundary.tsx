import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
             <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Algo salió mal</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
            La aplicación ha encontrado un error inesperado. Intenta recargar.
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-left mb-6 max-w-sm w-full overflow-auto max-h-32 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
             {this.state.error?.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
          >
            <RefreshCw size={20} />
            Recargar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;