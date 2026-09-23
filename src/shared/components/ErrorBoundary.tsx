import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Heart, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log silencioso — pode integrar com Sentry futuramente
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center text-center px-6 gap-6">
        {/* Coração pulsando */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 bg-rose-500/20 rounded-full animate-ping" />
          <Heart
            className="w-14 h-14 text-rose-500 fill-rose-500 relative z-10"
            strokeWidth={1.5}
          />
        </div>

        <div className="flex flex-col gap-2 max-w-sm">
          <h1
            className="text-white font-black text-2xl"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Ops, algo deu errado...
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Não se preocupe, isso não apaga nenhuma memória nossa. Tente recarregar a página.
          </p>
        </div>

        <button
          onClick={this.handleReload}
          className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full transition-colors active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar
        </button>

        {import.meta.env.DEV && this.state.error && (
          <details className="text-left max-w-sm w-full">
            <summary className="text-white/30 text-xs cursor-pointer">Detalhes do erro (dev)</summary>
            <pre className="mt-2 text-red-400/70 text-[10px] overflow-auto max-h-40 bg-white/5 p-3 rounded-lg">
              {this.state.error.message}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
