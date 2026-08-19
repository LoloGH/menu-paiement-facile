import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render-time exception and shows something other than a white page.
 *
 * Class component because React offers no hook equivalent: `componentDidCatch`
 * and `getDerivedStateFromError` only exist on classes.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("erreur de rendu", error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-cream bg-opacity-30 p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow p-8">
          <AlertTriangle className="h-12 w-12 text-restaurant-red mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Une erreur est survenue</h1>
          <p className="text-gray-600 mb-6">
            La page n'a pas pu s'afficher. Vous pouvez réessayer ou revenir à l'accueil.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs bg-gray-100 p-3 rounded mb-6 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => this.setState({ error: null })}>Réessayer</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
