import {Component} from "react";
import {Card, Space} from "antd";
import {withTranslation} from "react-i18next";
import Search from "antd/es/input/Search";
import {SearchOutlined} from "@ant-design/icons"

class SearchProblem extends Component<any, any> {

    onSearch = (text: string) => {
        console.log("search", text)
    }

    render() {
        return (
            <>
                <Card
                    title={
                        <>
                            <Space>
                                <SearchOutlined />
                                {`${this.props.t("searchProblem")} (${this.props.t("temporarilyClosed")})`}
                            </Space>
                        </>
                    }
                >
                    <Search
                        placeholder={this.props.t("pleaseEnterTheTitle,ProblemId,SourceAndOtherInformation")}
                        disabled={true}
                        onSearch={this.onSearch}
                        enterButton
                        allowClear
                    />
                </Card>
            </>
        )
    }
}

export default withTranslation()(SearchProblem)
