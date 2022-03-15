import React, {Component, useState} from "react";
import {withRouter} from "react-router-dom";
import EditableTableWithDrag from "../../Component/problem/From/Item/ItemProblemAdd";
import {isValueEmpty} from "../../Utils/empty";
import TimeError from "../Error/TimeError";
import Reconfirm from "../../Component/common/Reconfirm";
import SubmissionList from "../../Component/submission/SubmissionList/SubmissionList";
import cApi from "Utils/API/c-api"
import eApi from "../../Utils/API/e-api";
import SubmissionModal from "../../Component/submission/Processing/ModalProcessing";
import ListWithPagination from "../../Component/common/List/ListWithPagination";
import {Button, Card, Divider, Form, Input, List, Select, Space, Tag} from "antd";
import moment from "moment";
import {ClockCircleOutlined, LockOutlined, TeamOutlined} from "@ant-design/icons";
import {TimeDiff, TimeRangeState} from "../../Utils/Time";
import {RunningResultList, StateList, SubmissionMap} from "../../Type/ISubmission";
import TestCase from "../../Component/submission/TestCase";
import ProblemAddForm from "../../Component/problem/ProblemAddForm";

const CTest = (props: any) => {

    const [data, setData] = useState()


    return (
        <>
            <div style={{width: "1250px"}}>
                <EditableTableWithDrag
                    type={"problem"}
                    editable={true}
                    problemType={"program"}
                    initNewLine={(data: any[]) => {
                        const length = data.length
                        const last = length === 0 ? undefined : data[data.length - 1]
                        const code = isValueEmpty(last?.ProblemCode) ? undefined : last?.ProblemCode
                        const score = last?.ProblemScore
                        const submitNumber = last?.ProblemSubmitNumber
                        const number = code === undefined ? 0 : parseInt(code.substr(-4))
                        const NewCode = code === undefined ? undefined : code.substr(0, code.length - 4) + (number + 1).toString()
                        return {
                            id: Date.now(),
                            ProblemCode: NewCode,
                            ProblemScore: score,
                            ProblemSubmitNumber: submitNumber,
                        }
                    }}
                />
            </div>
        </>
    );



}

export default withRouter(CTest)