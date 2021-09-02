import {Component} from "react";
import Vditor from "vditor";
import {Button} from "antd";

export default class Editor extends Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            editValue: ""
        };
        this.ttt = this.ttt.bind(this)
    }

    vditor: any

    componentDidMount = () => {
        //组件挂载完成之后调用 注意一定要在组件挂载完成之后调用 否则会找不到注入的DOM
        this.createVidtor({value: this.state.editValue});
    }
    //创建编辑器 下面会详解
    createVidtor = (params: any) => {
        let {value} = params;
        value = value ? value : " ";
        let that = this;
        const vditor = new Vditor("vditor", {
            height: 800,
            mode: "wysiwyg", //及时渲染模式
            placeholder: "React Vditor",
            toolbar: [
                "emoji", "headings", "bold", "italic", "strike", "link", "|",
                "list", "ordered-list", "check", "outdent", "indent", "|",
                "quote", "line", "code", "inline-code", "insert-before", "insert-after", "|",
                "upload", "table", "|",
                "undo", "redo", "|",
                "fullscreen", "edit-mode",
                {
                    name: "more",
                    toolbar: [
                        "both", "code-theme", "content-theme",
                        "export", "outline", "preview",
                        "devtools", "info", "help"
                    ]
                },
                "|",
                {
                    hotkey: "⌘-S",
                    name: "save",
                    tipPosition: "s",
                    tip: "保存",
                    className: "right",
                    icon: `<img style="height: 16px" src='https://img.58cdn.com.cn/escstatic/docs/imgUpload/idocs/save.svg' alt="save"/>`,
                    click() {
                        //// TODO
                        //    保存
                    }
                }
            ],
            after() {
                vditor.setValue(value);
            },
            blur() {
                //// TODO
                //    保存
            },
            upload: {
                accept: "image/*",
                multiple: false,
                filename(name) {
                    return name
                        .replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, "")
                        .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, "")
                        .replace("/\\s/g", "");
                },
                handler(files): any {
                    function callback(path: any) {
                        let name = files[0] && files[0].name;
                        let succFileText = "";
                        if (vditor && vditor.vditor.currentMode === "wysiwyg") {
                            succFileText += `\n <img alt=${name} src="${path}">`;
                        } else {
                            succFileText += `  \n![${name}](${path})`;
                        }
                        document.execCommand("insertHTML", false, succFileText);
                    }

                    // that.handleImageUpload(files, callback);
                }
            }
        });
        this.vditor = vditor;
        return vditor;
    };


    ttt() {
        console.log(this.vditor.getValue())
    }

    //首先需要在render里面注入DOM，可自定义注入DOM的ID，初始化编辑器的时候使用自定义的ID即可
    render() {
        return (
            <>
                <div className="editorWrap">
                    <div id="vditor"/>
                </div>
                <Button onClick={this.ttt}>提交</Button>
            </>
        )

    }
}
