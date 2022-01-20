import React, {Component, Dispatch} from "react";
import {UserState} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import judgeAuth from "../../Utils/judgeAhtu";
import {connect} from "react-redux";
import {ManageState} from "../../Type/IManage";
import MApi from "Utils/API/m-api"
import TableWithPagination from "./TableWithPagination";


class TableWithSelection extends Component<any, any> {

    componentDidMount() {

    }

    render() {
        const selectedRowKeys = this.props.selectedRowKeys
        let rowSelection: any = {
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => {
                this.props.setSelectedRowKeys(selectedRowKeys)
            },
            // 多选时的下拉选项
            selections: [
                {
                    key: 'all',
                    text: this.props.t("selectedAll"),
                    onSelect: (changeableRowKeys: React.Key[]) => {
                        let newSelectedRowKeys = changeableRowKeys
                        newSelectedRowKeys = newSelectedRowKeys.concat(selectedRowKeys.filter((key: React.Key) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.props.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
                {
                    key: 'clear',
                    text: this.props.t("clear"),
                    onSelect: (changeableRowKeys: React.Key[]) => {
                        let newSelectedRowKeys = selectedRowKeys.filter((key: React.Key) => {
                            return !changeableRowKeys.includes(key);
                        })
                        this.props.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
                {
                    key: 'invert',
                    text: this.props.t("invert"),
                    onSelect: (changeableRowKeys: React.Key[]) => {
                        let newSelectedRowKeys = changeableRowKeys.filter((key:React.Key) => {
                            return !selectedRowKeys.includes(key);
                        });
                        newSelectedRowKeys = newSelectedRowKeys.concat(selectedRowKeys.filter((key: React.Key) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.props.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
            ]
        };
        if (!judgeAuth(this.props.roles, ["superadmin"])) {
            rowSelection = undefined
        }

        return (
            <>
                <TableWithPagination
                    size={this.props.size}
                    API={this.props.API}
                    rowKey={this.props.rowKey}
                    columns={this.props.colData}
                    rowSelection={rowSelection}
                />

            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    const MState: ManageState = state.ManageReducer
    return {
        roles: UState.userInfo?.roles,
        selectedRowKeys: MState.tableData.selectedRowKeys
    }

}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setSelectedRowKeys: (data: React.Key[]) =>
        dispatch({type: "setSelectedRowKeys", data: data})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(TableWithSelection)
))

