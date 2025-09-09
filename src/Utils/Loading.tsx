import React from "react";
import { Spin } from "antd";

/**
 * Simple full page loading spinner
 */
const Loading: React.FC = () => {
    return (
        <div className={"page-center"}>
            <Spin delay={500} size={"large"} />
        </div>
    );
};

export default Loading;
