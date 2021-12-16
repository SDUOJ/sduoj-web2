import {Component} from "react";
import {Button} from "antd";
import XLSX from "xlsx";
import {ButtonType} from "antd/lib/button/button";

interface IButtonText{
    ButtonText: string
    ButtonType: ButtonType
    fileName: string
    colMap: any
    nowData: any
}

class ExportExcel extends Component<IButtonText, any> {

    handleExportAll = (colMap: any, nowData: any, fileName: string) => {
        const json = nowData.map((item: any) => {
            return Object.keys(item).reduce((newData: any, key) => {
                newData[colMap[key] || key] = item[key]
                return newData
            }, {})
        });
        const sheet = XLSX.utils.json_to_sheet(json);
        this.openDownloadDialog(this.sheet2blob(sheet, undefined), fileName + `.xlsx`);
    }

    openDownloadDialog = (url: any, saveName: any) => {
        if (typeof url == 'object' && url instanceof Blob) {
            url = URL.createObjectURL(url); // 创建blob地址
        }
        var aLink = document.createElement('a');
        aLink.href = url;
        aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
        var event;
        if (window.MouseEvent) event = new MouseEvent('click');
        else {
            event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        }
        aLink.dispatchEvent(event);
    }

    sheet2blob = (sheet: any, sheetName: any) => {
        sheetName = sheetName || 'sheet1';
        let workbook: any = {
            SheetNames: [sheetName],
            Sheets: {}
        };
        workbook.Sheets[sheetName] = sheet; // 生成excel的配置项

        let wopts: any = {
            bookType: 'xlsx', // 要生成的文件类型
            bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
            type: 'binary'
        };
        let wbout = XLSX.write(workbook, wopts);

        // 字符串转ArrayBuffer
        function s2ab(s: any) {
            let buf = new ArrayBuffer(s.length);
            let view = new Uint8Array(buf);
            for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        return new Blob([s2ab(wbout)], {type: "application/octet-stream"});
    }

    render() {
        return (
            <>
                <Button
                    type={this.props.ButtonType}
                    onClick={() => {
                        this.handleExportAll(this.props.colMap, this.props.nowData, this.props.fileName)
                    }}
                >
                    {this.props.ButtonText}
                </Button>
            </>
        )
    }
}

export default ExportExcel