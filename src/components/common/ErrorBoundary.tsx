import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">Something went wrong</h2>
            <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
              Todo-chan encountered an unexpected display issue. Don't worry, your data in lists and tasks is securely saved in the cloud.
            </p>

            {this.state.error?.message && (
              <div className="p-3 mb-6 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-pink-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-pink-500 hover:bg-pink-600 transition flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleClearStorageAndReload}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
              >
                Reset Session & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
