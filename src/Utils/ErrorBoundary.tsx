import React, { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../Config/i18n';
import { reportError } from './errorReporter';

type Props = {
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKey?: string;
  children?: ReactNode;
};

type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError && this.props.onError(error, info);
    reportError({
      source: 'error-boundary',
      error,
      componentStack: info.componentStack ?? undefined,
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: 24 }} role="alert">
            <h3>{i18n.t('errorBoundaryTitle')}</h3>
            <p>{i18n.t('errorBoundaryDescription')}</p>
            <button type="button" onClick={() => this.setState({ hasError: false })}>
              {i18n.t('Retry')}
            </button>{' '}
            <button type="button" onClick={() => window.history.back()}>
              {i18n.t('Return')}
            </button>
          </div>
        )
      );
    }
    return this.props.children as any;
  }
}
