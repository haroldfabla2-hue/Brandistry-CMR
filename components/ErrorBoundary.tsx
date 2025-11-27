import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">System Encountered an Error</h1>
            <p className="text-slate-500 mb-6 text-sm">
              Something went wrong in the interface. The application state has been preserved safely.
            </p>
            
            <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-600 mb-6 text-left overflow-auto max-h-32 border border-slate-200">
              {this.state.error?.message}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
              >
                <RefreshCw size={18} /> Reload App
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                <Home size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}