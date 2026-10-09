import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Uncaught error in Floresta Verde CRM:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f6f4ee',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center',
          color: '#1e291b'
        }}>
          <div style={{
            maxWidth: '500px',
            background: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            border: '1px solid #e5e0d3'
          }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#166534' }}>
              Floresta Verde CRM
            </h1>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '20px', lineHeight: 1.5 }}>
              Ocorreu um erro ao carregar o aplicativo. Tente recarregar a página ou limpar os dados do navegador.
            </p>
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'left',
              fontFamily: 'monospace',
              marginBottom: '20px',
              overflowX: 'auto',
              maxHeight: '140px'
            }}>
              {this.state.error?.message || 'Erro inesperado'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                backgroundColor: '#166534',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
