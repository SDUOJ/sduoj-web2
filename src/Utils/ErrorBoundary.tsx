import React, {Component, ErrorInfo, ReactNode} from "react";

type Props = {
    fallback?: ReactNode
    onError?: (error: Error, info: ErrorInfo) => void
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

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div style={{padding: 24}}>
                    <h3>页面出错了</h3>
                    <p>请尝试刷新页面，或返回上一步重试。</p>
                </div>
            )
        }
        return this.props.children as any
    }
}
