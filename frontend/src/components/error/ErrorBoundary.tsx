import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-black px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/80 p-10 text-center backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertTriangle
                className="text-red-400"
                size={30}
              />
            </div>

            <h1 className="text-2xl font-bold text-white">
              Something went wrong
            </h1>

            <p className="mt-3 text-sm text-zinc-400">
              Forge encountered an unexpected error. Reload the
              application to continue.
            </p>

            <button
              onClick={this.handleReload}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-white transition hover:bg-violet-500"
            >
              <RotateCw size={18} />
              Reload Application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;