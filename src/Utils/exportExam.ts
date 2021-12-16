import {examID} from "../Type/types";

export function getColMap(){
    return {id: "编号", content: "内容"}
}

export function getData(eid: examID){
    return [
        {id: 1, content: "123"},
        {id: 2, content: "234"},
        {id: 3, content: "345"},
        {id: 4, content: "456"},
        {id: 5, content: "567"}
    ]
}