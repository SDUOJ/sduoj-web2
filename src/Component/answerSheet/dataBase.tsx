import {Component} from "react";
import {WithTranslation, withTranslation} from "react-i18next";
import {Row, Col, Card, Tree, Table} from 'antd';
import {UnControlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/idea.css';
import Problem from "../problem/Problem";
import {
    DownOutlined,
    FrownOutlined,
    SmileOutlined,
    MehOutlined,
    FrownFilled,
} from '@ant-design/icons';

require('codemirror/mode/sql/sql');


interface IDataBaseAnswerSheet extends WithTranslation {

}

interface SDataBaseAnswerSheet{
    columns: any
    data: any
}

class DataBaseAnswerSheet extends Component<IDataBaseAnswerSheet, SDataBaseAnswerSheet> {


    constructor(props: Readonly<IDataBaseAnswerSheet> | IDataBaseAnswerSheet) {
        super(props);
        this.state = {
            columns: [],
            data: []
        }
    }

    render() {

        let md: string = "## Description\n" +
            "给定两个整数 $x$ 和 $y$，打印它们的和\n" +
            "\n" +
            "\n" +
            "## Input\n" +
            "两个整数 $x$ 和 $y$，满足 $ 0 \\le x, y \\le 32767. $\n" +
            "\n" +
            "## Output\n" +
            "一个整数，代表 $x$ 和 $y$ 的和。\n" +
            "\n" +
            "## Sample Input\n" +
            "```\n" +
            "1381 529\n" +
            "```\n" +
            "\n" +
            "## Sample Output\n" +
            "```\n" +
            "1910\n" +
            "```\n" +
            "\n" +
            "\n" +
            "## Hint\n" +
            "* C:\n" +
            "```c\n" +
            "#include <stdio.h>\n" +
            "int main(void)\n" +
            "{\n" +
            "    int a, b;\n" +
            "    scanf(\"%d%d\", &a, &b);\n" +
            "    printf(\"%d\\n\", a + b);\n" +
            "    return 0;\n" +
            "}\n" +
            "```\n" +
            "* C++:\n" +
            "```cpp\n" +
            "#include <iostream>\n" +
            "using namespace std;\n" +
            "int main()\n" +
            "{\n" +
            "    int a, b;\n" +
            "    cin >> a >> b;\n" +
            "    cout << a + b << endl;\n" +
            "    return 0;\n" +
            "}\n" +
            "```\n" +
            "* Python2:\n" +
            "```python\n" +
            "a, b = [int(i) for i in raw_input().split()]\n" +
            "print(a + b)\n" +
            "```\n" +
            "* Python3:\n" +
            "```python\n" +
            "a, b = [int(i) for i in input().split()]\n" +
            "print(a + b)\n" +
            "```\n" +
            "* Java:\n" +
            "```java\n" +
            "import java.io.*;\n" +
            "import java.util.Scanner;\n" +
            "public class Main {\n" +
            "    public static void main(String[] args) {\n" +
            "        Scanner sc = new Scanner(System.in);\n" +
            "        int a = sc.nextInt(), b = sc.nextInt();\n" +
            "        System.out.println(a + b);\n" +
            "    }\n" +
            "}\n" +
            "```\n" +
            "* Java With Buffer IO:\n" +
            "```java\n" +
            "import java.io.*;\n" +
            "import java.util.StringTokenizer;\n" +
            "public class Main\n" +
            "{\n" +
            "    public static void main(String[] args)\n" +
            "    {\n" +
            "        int a = nextInt(), b = nextInt();\n" +
            "        out.println(a + b);\n" +
            "        out.flush();\n" +
            "    }\n" +
            "    static BufferedReader in=new BufferedReader(new InputStreamReader(System.in));\n" +
            "    static StringTokenizer tok;\n" +
            "    static String next() {hasNext();return tok.nextToken();  }\n" +
            "    static String nextLine() {try{return in.readLine();}catch (Exception e) {return null;}}\n" +
            "    static long nextLong() {return Long.parseLong(next());}\n" +
            "    static int nextInt() {return Integer.parseInt(next());}\n" +
            "    static PrintWriter out=new PrintWriter(new OutputStreamWriter(System.out));\n" +
            "    static boolean hasNext()\n" +
            "    {\n" +
            "        while(tok==null||!tok.hasMoreTokens()) try{tok=new StringTokenizer(in.readLine());}catch(Exception e){return false;}\n" +
            "        return true;\n" +
            "    }\n" +
            "}\n" +
            "```"

        console.log(md)

        const treeData = [
            {
                title: 'parent 1',
                key: '0-0',
                icon: <SmileOutlined/>,
                children: [
                    {
                        title: 'leaf',
                        key: '0-0-0',
                        icon: <MehOutlined/>,
                    },
                    {
                        title: 'leaf',
                        key: '0-0-1',
                        icon: <MehOutlined/>,
                    },
                ],
            },
        ];

        return (
            <div id="root" style={{minWidth: 1000}}>
                <Row style={{height: "50%"}}>
                    <Col span={12} style={{height: "100%"}}>
                        <Card title="题目描述" className={"Problem-card"}>
                            <Problem markdown={md} style={{overflowY: "scroll", height: "90%"}}/>
                        </Card>
                    </Col>
                    <Col span={12} >
                        <Card title="编辑代码" style={{minWidth: 500}}>
                            <CodeMirror
                                value='<h1>I ♥ react-codemirror2</h1>'
                                options={{
                                    mode: 'sql',
                                    theme: 'idea',
                                    lineNumbers: true
                                }}
                                onChange={(editor, data, value) => {
                                }}
                            />
                        </Card>

                    </Col>
                </Row>
                <Row style={{height:"50%"}}>
                    <Col span={5}>
                        <Card title="数据库列表" >
                            <Tree
                                showIcon
                                defaultExpandAll
                                defaultSelectedKeys={['0-0-0']}
                                switcherIcon={<DownOutlined/>}
                                treeData={treeData}
                            />
                        </Card>
                    </Col>
                    <Col span={19}>
                        <Card title="查询结果" >
                            <Table columns={this.state.columns} dataSource={this.state.data} />
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}

export default withTranslation()(DataBaseAnswerSheet)