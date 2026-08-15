import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('React crash:', error, info);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 p-4">
          <div className="max-w-lg ui-surface p-6 rounded-sm space-y-3">
            <h1 className="text-lg font-black text-rose-600">Something went wrong</h1>
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-900 p-3 rounded-xs border border-zinc-800">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="btn-primary text-xs"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
