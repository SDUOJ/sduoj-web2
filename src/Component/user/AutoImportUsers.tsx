import React, { useMemo, useState } from 'react';
import { Button, message, Modal, Space, Table, Tag, Upload } from 'antd';
import { InboxOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import Dragger from 'antd/lib/upload/Dragger';
import mApi from '../../Utils/API/m-api';
import { withTranslation } from 'react-i18next';
import { batchUserFields } from '../../Config/validation/requests';
import { constraintError } from '../../Config/validation/constraints';
import {
  matrixToRecords,
  parseXlsxMatrices,
  SPREADSHEET_LIMITS,
  SpreadsheetSheet,
} from '../../Utils/spreadsheetXlsx';

type ExcelUserRow = {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
  phone?: string | number;
  gender?: number | string;
  studentId?: string | number;
  banThirdParty?: number | string;
  banEmailUpdate?: number | string;
  banInfoUpdate?: number | string;
};

export const USER_IMPORT_LIMITS = SPREADSHEET_LIMITS;

const USER_IMPORT_HEADERS = [
  'username',
  'password',
  'email',
  'nickname',
  'phone',
  'gender',
  'studentId',
  'banThirdParty',
  'banEmailUpdate',
  'banInfoUpdate',
] as const;
const USER_IMPORT_HEADER_SET = new Set<string>(USER_IMPORT_HEADERS);
const DANGEROUS_HEADERS = new Set(['__proto__', 'prototype', 'constructor']);

export const parseUserWorkbook = async (
  readWorkbook: (input: ArrayBuffer) => Promise<SpreadsheetSheet[]>,
  input: ArrayBuffer,
): Promise<ExcelUserRow[]> => {
  const sheets = await parseXlsxMatrices(readWorkbook, input, USER_IMPORT_LIMITS);

  const result: ExcelUserRow[] = [];
  for (const { sheet: sheetName, data: matrix } of sheets) {
    if (matrix.length === 0) continue;
    if (DANGEROUS_HEADERS.has(sheetName)) throw new Error('Workbook sheet name is unsafe');
    for (const record of matrixToRecords(matrix, USER_IMPORT_HEADER_SET, [
      'username',
      'password',
      'email',
    ])) {
      if (result.length >= USER_IMPORT_LIMITS.maxRows) {
        throw new Error('Workbook contains too many rows');
      }
      const valueAt = (header: string) => record[header] as any;
      result.push({
        username: valueAt('username'),
        password: valueAt('password'),
        email: valueAt('email'),
        nickname: valueAt('nickname'),
        phone: valueAt('phone'),
        gender: valueAt('gender'),
        studentId: valueAt('studentId'),
        banThirdParty: valueAt('banThirdParty'),
        banEmailUpdate: valueAt('banEmailUpdate'),
        banInfoUpdate: valueAt('banInfoUpdate'),
      });
    }
  }
  return result;
};

type ParsedUser = {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
  phone?: string;
  gender?: number;
  studentId?: string;
  features: {
    banThirdParty: number;
    banEmailUpdate: number;
    banInfoUpdate: number;
  };
  roles: string[];
};

export const PASSWORD_DISPLAY_MASK = '••••••';

type DisplayUser = Omit<ParsedUser, 'password'> & {
  password: string;
  genderText: string;
};

/**
 * Keep the import payload separate from the table model. Passwords are needed
 * for the submit request, but must never be copied into values rendered by
 * the preview table.
 */
export const maskUserForDisplay = (
  item: ParsedUser,
  translate: (key: string) => string,
): DisplayUser => {
  const { password, ...safeItem } = item;
  return {
    ...safeItem,
    password: password ? PASSWORD_DISPLAY_MASK : '',
    genderText:
      item.gender === 0
        ? translate('GenderFemale') || '女'
        : item.gender === 1
          ? translate('GenderMale') || '男'
          : translate('GenderUnknown') || '问号',
  };
};

const isEmail = (v?: string) => (v ? /\S+@\S+\.\S+/.test(v) : true);

const normalizeNumber = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  return String(v);
};

const mapGender = (v: any): number | undefined =>
  v === undefined || v === null || v === '' ? undefined : Number(v);

const map01 = (v: any): number => (Number(v) === 1 ? 1 : 0);

const AutoImportUsers = (props: any) => {
  const { t } = props;
  const [visible, setVisible] = useState(false);
  const [rows, setRows] = useState<ParsedUser[]>([]);
  const [displayRows, setDisplayRows] = useState<any[]>([]);
  const [uploadState, setUploadState] = useState<number[]>([]); // 0 idle, 1 uploading, 2 success, 3 invalid, 4 failed
  const [canSubmitAll, setCanSubmitAll] = useState(true);

  const reset = () => {
    setRows([]);
    setDisplayRows([]);
    setUploadState([]);
  };

  const onClose = () => {
    setVisible(false);
    reset();
  };

  const parseAndValidate = (data: ExcelUserRow[]) => {
    const parsed: ParsedUser[] = [];
    const display: any[] = [];
    const states: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      // Skip instruction/example row heuristically
      const content = (r as any)?.username as any;
      if (
        (typeof content === 'string' && content.includes('此行')) ||
        (typeof content === 'string' && content.includes('样例'))
      ) {
        continue;
      }

      const item: ParsedUser = {
        username: String(r.username ?? ''),
        password: String(r.password ?? ''),
        email: r.email ? String(r.email) : undefined,
        nickname: r.nickname ? String(r.nickname) : undefined,
        phone: r.phone !== undefined && r.phone !== null ? String(r.phone) : undefined,
        gender: mapGender((r as any).gender),
        studentId: normalizeNumber(r.studentId),
        features: {
          banThirdParty: map01((r as any).banThirdParty),
          banEmailUpdate: map01((r as any).banEmailUpdate),
          banInfoUpdate: map01((r as any).banInfoUpdate),
        },
        roles: ['user'],
      };

      // validations（邮箱改为必填并校验格式）
      const valid =
        Object.entries(batchUserFields).every(
          ([key, rule]) => !constraintError(rule, item[key as keyof ParsedUser]),
        ) &&
        !!item.email &&
        isEmail(item.email);

      parsed.push(item);
      display.push(maskUserForDisplay(item, props.t));
      states.push(valid ? 0 : 3);
    }
    setRows(parsed);
    setDisplayRows(display);
    setUploadState(states);
  };

  const onImportExcel = async (file: File) => {
    // Remove the previous import before parsing a new file, including when
    // parsing fails, so an old password cannot remain visible in the modal.
    reset();
    if (file.size === 0 || file.size > USER_IMPORT_LIMITS.maxBytes) {
      message.error(props.t('FileTooLargeMB', { max: 5 }) || '文件大小不符合要求');
      return Upload.LIST_IGNORE;
    }
    try {
      const { default: readWorkbook } = await import('read-excel-file/browser');
      const data = await parseUserWorkbook(readWorkbook, await file.arrayBuffer());
      if (data.length === 0) {
        message.warning(props.t('NoData') || '未读取到数据');
        return false;
      }
      parseAndValidate(data);
      message.success(props.t('UploadSuccess') || '上传成功');
    } catch {
      message.error(props.t('FileTypeIncorrect') || '文件格式不正确');
    }
    return false;
  };

  const downloadTemplate = async () => {
    const { default: writeWorkbook } = await import('write-excel-file/browser');
    const sheet = [
      USER_IMPORT_HEADERS.map((value) => ({ value })),
      [
        "此行为样例，不可删除。\n必填，用户名必须由英文、数字、'_'构成，且长度为4~16",
        '必填，密码不能为空，长度必须在6-32位之间',
        '必填，邮箱',
        '选填，长度在30位之内',
        '选填，手机号码长度在11到16位',
        '0.女，1.男，2.问号，默认为2',
        '选填，学号长度在20位之内',
        '选填，0或1，1表示禁止使用第三方登录，默认为0',
        '选填，0或1，1表示禁止更改邮箱，默认为0',
        '选填，0或1，1表示禁止更改个人信息，默认为0',
      ].map((value) => ({ value, wrap: true })),
    ];
    await writeWorkbook(sheet, { sheet: 'users' }).toFile('批量导入用户模板.xlsx');
  };

  const submitAll = async () => {
    if (rows.length === 0) {
      message.error(props.t('DataNotLoaded') || '尚未加载数据');
      return;
    }
    // 仅提交校验通过的行（状态为0）；无效行保持“校验失败”
    const validIdx: number[] = [];
    const payload: any[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (uploadState[i] === 0) {
        validIdx.push(i);
        payload.push(rows[i]);
      }
    }
    if (payload.length === 0) {
      message.warning(props.t('NoData') || '未读取到数据');
      return;
    }
    setCanSubmitAll(false);
    try {
      await mApi.addUsers(payload as any);
      message.success(props.t('SubmitSuccess') || '提交成功');
      // 提交成功后清空表格
      reset();
    } catch (e) {
      message.error(props.t('SubmitFailed') || '提交失败');
      // 提交失败后也清空表格
      reset();
    } finally {
      setCanSubmitAll(true);
    }
  };

  const columns = useMemo(
    () => [
      { title: t('username') || 'username', dataIndex: 'username' },
      { title: t('password') || 'password', dataIndex: 'password' },
      { title: t('email') || 'email', dataIndex: 'email' },
      { title: t('nickname') || 'nickname', dataIndex: 'nickname' },
      { title: t('phone') || 'phone', dataIndex: 'phone' },
      { title: t('sex') || 'gender', dataIndex: 'genderText' },
      { title: t('student_id') || 'studentId', dataIndex: 'studentId' },
      {
        title: t('Dis3pLogin') || 'banThirdParty',
        dataIndex: ['features', 'banThirdParty'],
        render: (v: number) => (v ? <Tag color="red">1</Tag> : <Tag>0</Tag>),
      },
      {
        title: t('DisEmailUpd') || 'banEmailUpdate',
        dataIndex: ['features', 'banEmailUpdate'],
        render: (v: number) => (v ? <Tag color="red">1</Tag> : <Tag>0</Tag>),
      },
      {
        title: t('DisInfoUpd') || 'banInfoUpdate',
        dataIndex: ['features', 'banInfoUpdate'],
        render: (v: number) => (v ? <Tag color="red">1</Tag> : <Tag>0</Tag>),
      },
    ],
    [t],
  );

  return (
    <>
      <Button type="default" onClick={() => setVisible(true)}>
        <PlusOutlined /> {props.t('BatchImport') || '批量导入'}
      </Button>
      <Modal
        title={props.t('BatchImportUsers') || '批量导入用户'}
        maskClosable={false}
        open={visible}
        onCancel={onClose}
        width={1200}
        footer={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
              {props.t('DownloadTemplate') || '下载模板'}
            </Button>
            <Button onClick={onClose}>{props.t('Cancel') || '取消'}</Button>
            <Button type="primary" onClick={submitAll} disabled={!canSubmitAll}>
              {props.t('SubmitAll') || '全部提交'}
            </Button>
          </Space>
        }
      >
        <Dragger
          multiple={false}
          accept={'.xlsx'}
          action=""
          listType="text"
          beforeUpload={onImportExcel}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {props.t('UploadDragAreaText') || '点击或拖拽 Excel 到此处上传'}
          </p>
          <p className="ant-upload-hint">
            {props.t('UploadExcelHint') ||
              '仅支持 .xlsx；前两行为模板说明，请勿删除；从第3行开始填写数据。'}
          </p>
        </Dragger>
        <div style={{ marginTop: 10 }} />
        <Table
          size="small"
          rowKey={(r: any, idx?: number) => (idx ?? 0).toString()}
          pagination={{ pageSize: 8 }}
          columns={columns as any}
          dataSource={displayRows}
        />
      </Modal>
    </>
  );
};

export default withTranslation()(AutoImportUsers);
