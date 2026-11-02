import { Component } from 'react';
import { ErrorState } from './StateViews.jsx';

/** Catches render errors so one broken page never blanks the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Phase 2: send to an error-monitoring service.
    console.error('UI error:', error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl px-4 py-32">
          <ErrorState title="This page failed to load" error={{ message: 'An unexpected error occurred. Please reload the page or try again later.' }} onRetry={() => window.location.reload()} />
        </div>
      );
    }
    return this.props.children;
  }
}
