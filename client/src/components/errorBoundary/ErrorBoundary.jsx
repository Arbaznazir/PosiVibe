import React from 'react';
import './errorBoundary.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
    // Reset error state and reload the page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    // Reset error state and navigate to home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-animation">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="error-content">
              <h1 className="error-title">Oops! Something went wrong</h1>
              <p className="error-message">
                We're sorry, but something unexpected happened. Don't worry, it's not your fault!
              </p>
              
              <div className="error-details">
                <div className="error-suggestions">
                  <h3>What you can try:</h3>
                  <ul>
                    <li>🔄 Refresh the page</li>
                    <li>🏠 Go back to the home page</li>
                    <li>📱 Check your internet connection</li>
                    <li>⏰ Try again in a few minutes</li>
                  </ul>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="error-technical">
                    <summary>Technical Details (Development Mode)</summary>
                    <div className="error-stack">
                      <h4>Error:</h4>
                      <pre>{this.state.error.toString()}</pre>
                      {this.state.errorInfo && (
                        <>
                          <h4>Component Stack:</h4>
                          <pre>{this.state.errorInfo.componentStack}</pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="error-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={this.handleRefresh}
                >
                  🔄 Refresh Page
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={this.handleGoHome}
                >
                  🏠 Go Home
                </button>
              </div>

              <div className="error-footer">
                <p>
                  If this problem persists, please contact our support team.
                </p>
                <div className="error-brand">
                  <span className="brand-name">PosiVibe</span>
                  <span className="brand-tagline">Positive Social Networking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 