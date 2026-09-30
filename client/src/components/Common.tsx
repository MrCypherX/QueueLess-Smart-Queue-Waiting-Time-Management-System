import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Loading live data...',
}) => (
  <div className="py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin glow-indigo" />
    <p className="text-xs text-slate-400 font-medium tracking-wide">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({
  title,
  description,
  actionText,
  onAction,
  icon = <Inbox className="w-10 h-10 text-slate-500" />,
}) => (
  <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800 flex flex-col items-center justify-center my-6">
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-4">{icon}</div>
    <h3 className="text-base font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
      >
        {actionText}
      </button>
    )}
  </div>
);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-rose-500/40">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
