import React, {Component, Dispatch} from "react";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {connect} from "react-redux";
import TableWithPagination from "./TableWithPagination";
import {TableState} from "../../../Type/ITable";
import {ck} from "../../../Utils/empty";
import TableWithAllData from "./TableWithAllData";


class TableWithSelection extends Component<any, any> {

    componentDidMount() {

    }

    setSelectedRowKeys = (data: any) =>{
        this.props.setSelectedRowKeys(data, this.props.name)
    }

    render() {
        const selectedRowKeys = ck(this.props.tableData[this.props.name]?.selectedRowKeys, [])
        let rowSelection: any = {
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => {
                this.setSelectedRowKeys(selectedRowKeys)
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
                        this.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
                {
                    key: 'clear',
                    text: this.props.t("clear"),
                    onSelect: (changeableRowKeys: React.Key[]) => {
                        let newSelectedRowKeys = selectedRowKeys.filter((key: React.Key) => {
                            return !changeableRowKeys.includes(key);
                        })
                        this.setSelectedRowKeys(newSelectedRowKeys)
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
                        this.setSelectedRowKeys(newSelectedRowKeys)
                    },
                },
            ]
        };

        return (
            <>
                {this.props.uesAlldata && (
                    <TableWithAllData
                        {... this.props}
                        rowSelection={this.props.disableSelection ? undefined : rowSelection}
                    />
                )}
                {this.props.uesAlldata === undefined && (
                    <TableWithPagination
                        {... this.props}
                        rowSelection={this.props.disableSelection ? undefined : rowSelection}
                    />
                )}
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const TState: TableState = state.TableReduce
    return {
        tableData: TState.tableData
    }

}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setSelectedRowKeys: (data: React.Key[], name: string) =>
        dispatch({type: "setSelectedRowKeys", data: data, name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(TableWithSelection)
))

