import {Component} from "react";
import {withRouter} from "react-router-dom";
import {SyncJudging} from "../Component/submission/SyncJudging";
import CodeHighlight from "../Component/common/CodeHighlight";
import Processing from "../Component/submission/Processing";

const str =
    `import java.util.ArrayList;
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ArrayList<Long> list = new ArrayList<Long>();
        int N = 0;
        while ((N = (sc.nextInt())) != 0) {
            long sum = 0;
            for (int i = 0; i < N; i++) {
                int n = sc.nextInt();
                sum += n;
            }
            list.add(sum);
        }
        // 存储sum值
        for (long value : list) {
            System.out.println(value);
        }
    }
}`

class CTest extends Component<any, any> {

    render() {
        return (
            <>
                <div style={{width: "900px"}}>
                    <CodeHighlight code={str} lang={"java"}/>
                </div>
                <Processing

                />

            </>
        );
    }
}

export default withRouter(CTest)