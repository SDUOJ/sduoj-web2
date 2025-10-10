import React from "react";
import {Alert} from "antd";
import {useTranslation} from "react-i18next";
import {unix2Time} from "../../Utils/Time";
import "../../Assert/css/problemSetLatePermission.css";

interface LatePermissionNoticeProps {
    latePermission?: any;
}

const formatNumberText = (value: number) => {
    if (!Number.isFinite(value)) return "-";
    const fixed = value.toFixed(2);
    return fixed.replace(/\.?0+$/, "");
};

const LatePermissionNotice: React.FC<LatePermissionNoticeProps> = ({latePermission}) => {
    const {t} = useTranslation();

    if (!latePermission) return null;

    const discountValue = Number(latePermission.discount ?? 1);
    const discountText = formatNumberText(discountValue);
    const percentText = Number.isFinite(discountValue) ? `${Math.round(discountValue * 100)}%` : "-";

    const duration = latePermission.duration_minute !== undefined && latePermission.duration_minute !== null
        ? Number(latePermission.duration_minute)
        : undefined;
    const startTime = latePermission.start_time !== undefined && latePermission.start_time !== null
        ? Number(latePermission.start_time)
        : undefined;
    const rawExpire = latePermission.expire_time !== undefined && latePermission.expire_time !== null
        ? Number(latePermission.expire_time)
        : undefined;
    const fallbackExpire = startTime && duration ? startTime + duration * 60000 : undefined;
    const expireTime = rawExpire ?? fallbackExpire;
    const now = Date.now();

    const descriptionLines: string[] = [];

    if (!startTime) {
        descriptionLines.push(t("LatePermissionBannerPending", {duration: duration ?? 0}));
    } else if (expireTime && expireTime < now) {
        descriptionLines.push(t("LatePermissionBannerExpired", {expire: unix2Time(expireTime)}));
        if (duration) {
            descriptionLines.push(t("LatePermissionBannerDuration", {duration}));
        }
    } else {
        descriptionLines.push(t("LatePermissionBannerActive", {
            start: unix2Time(startTime),
            expire: expireTime ? unix2Time(expireTime) : t("LatePermissionBannerNoExpire")
        }));
        if (duration) {
            descriptionLines.push(t("LatePermissionBannerDuration", {duration}));
        }
        if (expireTime) {
            const minutesLeft = Math.max(0, Math.ceil((expireTime - now) / 60000));
            descriptionLines.push(t("LatePermissionBannerRemaining", {minutes: minutesLeft}));
        }
    }

    return (
        <div className={"ps-late-permission-banner"}>
            <Alert
                banner
                type={"info"}
                showIcon
                message={t("LatePermissionBannerTitle", {discount: discountText, percent: percentText})}
                description={(
                    <div>
                        {descriptionLines.map((line, index) => (
                            <div key={index}>{line}</div>
                        ))}
                    </div>
                )}
            />
        </div>
    );
};

export default LatePermissionNotice;
