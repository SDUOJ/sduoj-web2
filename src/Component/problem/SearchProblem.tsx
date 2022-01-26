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
                                搜索题目
                            </Space>
                        </>
                    }
                >
                    <Search
                        placeholder="请输入题目标题，题号，来源等信息"
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