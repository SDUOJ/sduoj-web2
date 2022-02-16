import {withTranslation} from "react-i18next";
import SubmissionList from "./SubmissionList";
import {Card} from "antd";

const RecentSubmissionList = (props: any) => {
    return (
        <>
            <SubmissionList
                {...props}
                title={"最近提交"}
                lessInfo={true}
            />
        </>
    )
}

export default withTranslation()(RecentSubmissionList)