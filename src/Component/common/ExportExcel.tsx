import React from 'react';
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

const ExportExcel = (props: IButtonText) => {
  const handleExportAll = async (colMap: any, nowData: any[], fileName: string) => {
    const records = nowData.map((item: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(item).map(([key, value]) => [colMap[key] || key, value])),
    );
    await downloadXlsxRecords(records, `${fileName}.xlsx`);
  };

  const handleExportAllJson = async (records: Record<string, unknown>[], fileName: string) => {
    await downloadXlsxRecords(records, `${fileName}.xlsx`);
  };

  return (
    <Button
      type={props.ButtonType}
      {...props.ButtonProps}
      onClick={async () => {
        try {
          if (props.getJson !== undefined) {
            await handleExportAllJson(await props.getJson(), props.fileName);
          } else {
            const nowData = props.nowData();
            await handleExportAll(props.colMap(nowData), nowData, props.fileName);
          }
        } catch (error) {
          message.error(String(error));
        }
      }}
    >
      {props.ButtonText}
    </Button>
  );
};

export default ExportExcel;
