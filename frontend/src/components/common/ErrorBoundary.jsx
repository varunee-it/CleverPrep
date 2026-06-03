import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <h2 className="text-red-600 font-semibold mb-2">Something went wrong.</h2>
          <p className="text-red-500 text-sm">{this.state.error?.message || "An unexpected error occurred."}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
