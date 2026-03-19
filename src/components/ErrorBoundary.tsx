import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      
      try {
        // Check if it's a Firestore error JSON
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError.error) {
          errorMessage = `Database Error: ${parsedError.error}. Please check your permissions.`;
        }
      } catch (e) {
        // Not a JSON error, use the raw message if available
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen bg-[#0a0502] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#1a0a05] border border-red-900/50 p-8 rounded-3xl space-y-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Something went wrong</h2>
            <p className="text-[#8e9299] text-sm font-mono bg-black/40 p-4 rounded-xl border border-white/5 break-words">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#ff4e00] text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-[#ff6a26] transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
