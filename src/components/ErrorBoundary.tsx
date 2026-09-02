import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Top-level error boundary: never show a blank white screen in production. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SRD] Uncaught render error:", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            An unexpected error occurred. Reloading usually fixes it — your data is safe.
          </p>
          <pre className="mt-4 max-w-md overflow-x-auto rounded-lg bg-zinc-100 px-4 py-2 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {this.state.error.message}
          </pre>
          <button
            onClick={this.reset}
            className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
