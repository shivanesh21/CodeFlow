import React from "react";
import "./ErrorBoundary.css";

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
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              An unexpected error occurred in the application view. Please reload the page or click below to return to safety.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/dashboard";
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
