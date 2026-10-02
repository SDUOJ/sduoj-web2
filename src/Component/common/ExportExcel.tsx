import { Component } from 'react';
import { Button, message } from 'antd';
import type { ButtonProps } from 'antd';
import { downloadXlsxRecords } from '../../Utils/spreadsheetXlsx';

interface IButtonText {
  ButtonText: any;
  ButtonType: ButtonProps['type'];
  ButtonProps?: any;
  fileName: string;
  colMap?: any;
  nowData?: any;
  getJson?: any;
}

class ExportExcel extends Component<IButtonText> {
  handleExportAll = async (colMap: any, nowData: any[], fileName: string) => {
    const records = nowData.map((item: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(item).map(([key, value]) => [colMap[key] || key, value])),
    );
    await downloadXlsxRecords(records, `${fileName}.xlsx`);
  };

  handleExportAllJson = async (records: Record<string, unknown>[], fileName: string) => {
    await downloadXlsxRecords(records, `${fileName}.xlsx`);
  };

  render() {
    return (
      <Button
        type={this.props.ButtonType}
        {...this.props.ButtonProps}
        onClick={async () => {
          try {
            if (this.props.getJson !== undefined) {
              await this.handleExportAllJson(await this.props.getJson(), this.props.fileName);
            } else {
              const nowData = this.props.nowData();
              await this.handleExportAll(this.props.colMap(nowData), nowData, this.props.fileName);
            }
          } catch (error) {
            message.error(String(error));
          }
        }}
      >
        {this.props.ButtonText}
      </Button>
    );
  }
}

export default ExportExcel;
