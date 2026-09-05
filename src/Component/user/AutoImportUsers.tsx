import React, { useMemo, useState } from 'react';
import { Button, message, Modal, Space, Table, Tag, Upload } from 'antd';
import { InboxOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import Dragger from 'antd/lib/upload/Dragger';
import mApi from '../../Utils/API/m-api';
import { withTranslation } from 'react-i18next';
import { batchUserFields } from '../../Config/validation/requests';
import { constraintError } from '../../Config/validation/constraints';

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

export const USER_IMPORT_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxSheets: 5,
  maxRows: 5000,
  maxColumns: 32,
  maxCellCharacters: 32767,
} as const;

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

const hasWorkbookSignature = (bytes: Uint8Array) =>
  (bytes[0] === 0x50 && bytes[1] === 0x4b) ||
  (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0);

export const parseUserWorkbook = (XLSX: any, input: ArrayBuffer): ExcelUserRow[] => {
  if (input.byteLength === 0 || input.byteLength > USER_IMPORT_LIMITS.maxBytes) {
    throw new Error('Workbook size is outside the allowed range');
  }
  if (!hasWorkbookSignature(new Uint8Array(input))) {
    throw new Error('Workbook signature is invalid');
  }

  const workbook = XLSX.read(input, {
    type: 'array',
    sheetRows: USER_IMPORT_LIMITS.maxRows + 2,
  });
  const sheetNames = Array.isArray(workbook.SheetNames)
    ? workbook.SheetNames
    : Object.keys(workbook.Sheets ?? {});
  if (sheetNames.length === 0 || sheetNames.length > USER_IMPORT_LIMITS.maxSheets) {
    throw new Error('Workbook contains too many sheets');
  }

  const result: ExcelUserRow[] = [];
  for (const sheetName of sheetNames) {
    if (DANGEROUS_HEADERS.has(sheetName)) throw new Error('Workbook sheet name is unsafe');
    const sheet = workbook.Sheets?.[sheetName];
    if (!sheet) throw new Error('Workbook sheet is missing');
    if (sheet['!ref']) {
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const rowCount = range.e.r - range.s.r + 1;
      const columnCount = range.e.c - range.s.c + 1;
      if (rowCount > USER_IMPORT_LIMITS.maxRows + 2) {
        throw new Error('Workbook contains too many rows');
      }
      if (columnCount > USER_IMPORT_LIMITS.maxColumns) {
        throw new Error('Workbook contains too many columns');
      }
    }

    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: null,
      blankrows: false,
    }) as unknown[][];
    if (matrix.length === 0) continue;
    const rawHeaders = matrix[0];
    const lastHeader = rawHeaders.reduce<number>(
      (last, value, index) => (value === null || value === '' ? last : index),
      -1,
    );
    const headers = rawHeaders.slice(0, lastHeader + 1).map((value) => String(value ?? '').trim());
    if (headers.length === 0 || headers.length > USER_IMPORT_LIMITS.maxColumns) {
      throw new Error('Workbook header count is outside the allowed range');
    }
    if (new Set(headers).size !== headers.length)
      throw new Error('Workbook headers are duplicated');
    if (
      headers.some(
        (header) =>
          header.length === 0 ||
          DANGEROUS_HEADERS.has(header) ||
          !USER_IMPORT_HEADER_SET.has(header),
      )
    ) {
      throw new Error('Workbook contains an unsupported header');
    }
    if (!['username', 'password', 'email'].every((header) => headers.includes(header))) {
      throw new Error('Workbook is missing a required header');
    }

    for (const values of matrix.slice(1)) {
      if (result.length >= USER_IMPORT_LIMITS.maxRows) {
        throw new Error('Workbook contains too many rows');
      }
      if (
        values.some(
          (value) =>
            typeof value === 'string' && value.length > USER_IMPORT_LIMITS.maxCellCharacters,
        )
      ) {
        throw new Error('Workbook contains an oversized cell');
      }
      const valueAt = (header: string) => values[headers.indexOf(header)] as any;
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

const isEmail = (v?: string) => (v ? /\S+@\S+\.\S+/.test(v) : true);

const normalizeNumber = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  return String(v);
};

const mapGender = (v: any): number | undefined =>
  v === undefined || v === null || v === '' ? undefined : Number(v);

const map01 = (v: any): number => (Number(v) === 1 ? 1 : 0);

const AutoImportUsers = (props: any) => {
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
      display.push({
        ...item,
        genderText:
          item.gender === 0
            ? props.t('GenderFemale') || '女'
            : item.gender === 1
              ? props.t('GenderMale') || '男'
              : props.t('GenderUnknown') || '问号',
      });
      states.push(valid ? 0 : 3);
    }
    setRows(parsed);
    setDisplayRows(display);
    setUploadState(states);
  };

  const onImportExcel = async (file: File) => {
    if (file.size === 0 || file.size > USER_IMPORT_LIMITS.maxBytes) {
      message.error(props.t('FileTooLargeMB', { max: 5 }) || '文件大小不符合要求');
      return Upload.LIST_IGNORE;
    }
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const data = parseUserWorkbook(XLSX, await file.arrayBuffer());
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
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));
    const header = [...USER_IMPORT_HEADERS];
    const instructions: any = [
      {
        username: "此行为样例，不可删除。\n必填，用户名必须由英文、数字、'_'构成，且长度为4~16",
        password: '必填，密码不能为空，长度必须在6-32位之间',
        email: '必填，邮箱',
        nickname: '选填，长度在30位之内',
        phone: '选填，手机号码长度在11到16位',
        gender: '0.女，1.男，2.问号，默认为2',
        studentId: '选填，学号长度在20位之内',
        banThirdParty: '选填，0或1，1表示禁止使用第三方登录，默认为0',
        banEmailUpdate: '选填，0或1，1表示禁止更改邮箱，默认为0',
        banInfoUpdate: '选填，0或1，1表示禁止更改个人信息，默认为0',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(instructions, { header });
    // Make row1 as header explicitly
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'users');
    XLSX.writeFile(wb, '批量导入用户模板.xlsx');
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
      { title: props.t('username') || 'username', dataIndex: 'username' },
      { title: props.t('password') || 'password', dataIndex: 'password' },
      { title: props.t('email') || 'email', dataIndex: 'email' },
      { title: props.t('nickname') || 'nickname', dataIndex: 'nickname' },
      { title: props.t('phone') || 'phone', dataIndex: 'phone' },
      { title: props.t('sex') || 'gender', dataIndex: 'genderText' },
      { title: props.t('student_id') || 'studentId', dataIndex: 'studentId' },
      {
        title: props.t('Dis3pLogin') || 'banThirdParty',
        dataIndex: ['features', 'banThirdParty'],
        render: (v: number) => (v ? <Tag color="red">1</Tag> : <Tag>0</Tag>),
      },
      {
        title: props.t('DisEmailUpd') || 'banEmailUpdate',
        dataIndex: ['features', 'banEmailUpdate'],
        render: (v: number) => (v ? <Tag color="red">1</Tag> : <Tag>0</Tag>),
      },
      {
        title: props.t('DisInfoUpd') || 'banInfoUpdate',
        dataIndex: ['features', 'banInfoUpdate'],
        render: (v: number) => (v ? <Tag color="red">1</Tag> : <Tag>0</Tag>),
      },
    ],
    [props.i18n?.language],
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
          accept={'.xlsx,.xls'}
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
              '仅支持 .xlsx/.xls；前两行为模板说明，请勿删除；从第3行开始填写数据。'}
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
