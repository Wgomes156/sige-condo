
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border max-w-md w-full">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-600 mb-8">
              Ocorreu um erro inesperado na renderização desta página.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg mb-8 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-500 font-mono">
                {this.state.error?.message || "Erro de renderização desconhecido"}
              </code>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600 font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar Sistema
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
