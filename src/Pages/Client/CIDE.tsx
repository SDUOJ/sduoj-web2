import "Assert/css/IDE.css"
import {SplitPane} from "react-multi-split-pane"
import {useEffect, useState} from "react";

const CIDE = (props: any) => {

    const [code, setCode] = useState<string>('// type your code...')

    const options = {
        selectOnLineNumbers: true
    };

    useEffect(()=>{

    }, [])

    return (
        <>
            <SplitPane split="vertical" minSize={[500, 500]}>
                <div>123</div>
                <div>
                    <div id={"container"}>

                    </div>
                </div>
            </SplitPane>
        </>
    )
}

export default CIDE