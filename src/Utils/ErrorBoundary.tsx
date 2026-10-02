import React, {Component, ErrorInfo, ReactNode} from "react";

type Props = {
    fallback?: ReactNode
    onError?: (error: Error, info: ErrorInfo) => void
    resetKey?: string
    children?: ReactNode
}

type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.props.onError && this.props.onError(error, info)
        // 可在此处上报日志
    }

    componentDidUpdate(prevProps: Props) {
        if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
            this.setState({hasError: false})
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div style={{padding: 24}} role="alert">
                    <h3>页面出错了</h3>
                    <p>请尝试重新加载当前内容，或返回上一步。</p>
                    <button type="button" onClick={() => this.setState({hasError: false})}>重试</button>{' '}
                    <button type="button" onClick={() => window.history.back()}>返回</button>
                </div>
            )
        }
        return this.props.children as any
    }
}
