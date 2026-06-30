import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      const payload = {
        message: error.message,
        stack: error.stack?.slice(0, 2000),
        component: info.componentStack?.slice(0, 1000),
        url: window.location.href,
        ts: new Date().toISOString(),
      };
      navigator.sendBeacon?.(
        '/api/client-error',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    } catch {
      // best-effort
    }
  }

  private handleReload = () => {
    sessionStorage.removeItem('__chunk_reloaded__');
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. This has been logged automatically.
        </p>
        <button
          onClick={this.handleReload}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to home
        </button>
      </div>
    );
  }
}
