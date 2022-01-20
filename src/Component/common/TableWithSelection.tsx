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


    delete = (ids: number[]) => {
        this.setState((state: any) => {
            return {
                list: state.list.filter((item: any) => !ids.includes(item.id)),
                total: state.total - ids.length,
            }
        })
        this.props.selectedRowKeys.filter((id: number) => !ids.includes(id))

    }

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
                    onSelect: (changeableRowKeys: number[]) => {
                        let newSelectedRowKeys = changeableRowKeys
                        newSelectedRowKeys = newSelectedRowKeys.concat(selectedRowKeys.filter((key: number) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.props.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
                {
                    key: 'clear',
                    text: this.props.t("clear"),
                    onSelect: (changeableRowKeys: number[]) => {
                        let newSelectedRowKeys = selectedRowKeys.filter((key: number) => {
                            return !changeableRowKeys.includes(key);
                        })
                        this.props.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
                {
                    key: 'invert',
                    text: this.props.t("invert"),
                    onSelect: (changeableRowKeys: number[]) => {
                        let newSelectedRowKeys = changeableRowKeys.filter((key) => {
                            return !selectedRowKeys.includes(key);
                        });
                        newSelectedRowKeys = newSelectedRowKeys.concat(selectedRowKeys.filter((key: number) => {
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
                    API={MApi.getUserList}
                    rowKey={"id"}
                    size={"small"}
                    columns={this.props.colData}
                    // 行多选
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
        dispatch({type: "setSelectedRowKeys", value: data})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(TableWithSelection)
))

