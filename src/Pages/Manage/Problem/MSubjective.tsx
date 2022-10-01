import {Router, withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";

const MSubjective = (props: any) =>{

    const colData: any[] = [
        {
            title: "题号",
            dataIndex: "subjectiveProblemCode",
            width: 64,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: "标题",
            dataIndex: "title",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {

        }
    ]

    return (
        <>

        </>
    )
}

export default withTranslation()(withRouter(MSubjective))