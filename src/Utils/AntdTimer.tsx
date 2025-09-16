import React from "react";
import {Statistic} from "antd";

export type AntdTimerProps = {
    type?: 'countdown' | 'countup' // 目前仅用于 Timer 分支；回退分支默认为倒计时
    title?: React.ReactNode
    value: number
    format?: string
    prefix?: React.ReactNode
    suffix?: React.ReactNode
    valueStyle?: React.CSSProperties
    className?: string
    onFinish?: () => void
    onChange?: (value: number) => void
}

// 统一的计时器：优先使用 antd@5.25+ 的 Statistic.Timer（推荐），否则回退到 Statistic.Countdown
const AntdTimer: React.FC<AntdTimerProps> = (props) => {
    const S: any = Statistic as any;
    const TimerComp = S?.Timer;
    if (TimerComp) {
        // 默认使用倒计时
        const type = props.type ?? 'countdown'
        return (
            <TimerComp
                type={type}
                title={props.title}
                value={props.value}
                format={props.format}
                prefix={props.prefix}
                suffix={props.suffix}
                valueStyle={props.valueStyle}
                className={props.className}
                onFinish={props.onFinish}
                onChange={props.onChange}
            />
        )
    }
    // 回退：老版本使用 Countdown
    const CountdownComp = S?.Countdown;
    return (
        <CountdownComp
            title={props.title}
            value={props.value}
            format={props.format}
            prefix={props.prefix}
            suffix={props.suffix}
            valueStyle={props.valueStyle}
            className={props.className}
            onFinish={props.onFinish}
            onChange={props.onChange}
        />
    )
}

export default AntdTimer
