import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="bg-[#262626] border border-[#da1e28] p-4 font-mono text-xs text-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#ff8389]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">
                {this.props.title || 'Component Error'}
              </span>
            </div>
            <button
              onClick={this.handleReset}
              className="px-2 py-1 bg-[#161616] hover:bg-[#393939] border border-[#525252] text-xs text-[#c6c6c6] hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
          <p className="text-[#c6c6c6] text-[11px] break-words">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
