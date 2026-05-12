import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  error: Error;
  resetErrorBoundary?: () => void;
}

export default class ErrorFallback extends Component<Props> {
  static defaultProps = {
    resetErrorBoundary: () => window.location.reload(),
  };

  render() {
    const { error, resetErrorBoundary } = this.props;
    return (
      <div className="p-8 text-red-600 max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
        <p className="text-sm bg-gray-100 p-4 rounded mb-4">{error.message}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-gray-400 mt-2 mb-4 overflow-x-auto">{error.stack}</pre>
        )}
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Recargar
        </button>
      </div>
    );
  }
}