import {withTranslation} from "react-i18next";
import SubmissionList from "./SubmissionList";

const RecentSubmissionList = (props: any) => {
    return (
        <>
            <SubmissionList
                {...props}
                title={props.t("recentlySubmitted")}
                lessInfo={true}
            />
        </>
    )
}

export default withTranslation()(RecentSubmissionList)
