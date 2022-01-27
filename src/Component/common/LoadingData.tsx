import {Spin} from "antd";

const LoadingData = (props: any)=>{
    if(props.loading === true){
        return (
            <div className={"page-center"}>
                <Spin size={"large"}/>
            </div>
        )
    }else{
        return props.content
    }
}

export default LoadingData