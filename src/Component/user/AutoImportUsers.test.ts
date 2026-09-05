import * as XLSX from 'xlsx';
import { parseUserWorkbook, USER_IMPORT_LIMITS } from './AutoImportUsers';

const workbookBuffer = (rows: unknown[][]) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'users');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
};

it('parses the supported user columns without creating user-controlled object keys', () => {
  const rows = parseUserWorkbook(
    XLSX,
    workbookBuffer([
      ['username', 'password', 'email', 'studentId', 'banThirdParty'],
      ['alice', 'secret12', 'alice@example.com', 20260001, 1],
    ]),
  );

  expect(rows).toEqual([
    expect.objectContaining({
      username: 'alice',
      password: 'secret12',
      email: 'alice@example.com',
      studentId: '20260001',
      banThirdParty: '1',
    }),
  ]);
  expect(Object.getPrototypeOf(rows[0])).toBe(Object.prototype);
});

it.each(['__proto__', 'prototype', 'constructor'])('rejects the dangerous %s header', (header) => {
  expect(() =>
    parseUserWorkbook(
      XLSX,
      workbookBuffer([
        ['username', 'password', 'email', header],
        ['alice', 'secret12', 'alice@example.com', 'polluted'],
      ]),
    ),
  ).toThrow('unsupported header');
  expect((Object.prototype as any).polluted).toBeUndefined();
});

it('rejects invalid signatures before invoking the parser', () => {
  const read = jest.fn();
  expect(() => parseUserWorkbook({ read }, new Uint8Array([1, 2, 3, 4]).buffer)).toThrow(
    'signature',
  );
  expect(read).not.toHaveBeenCalled();
});

it('rejects oversized ranges before materializing worksheet rows', () => {
  const fakeXlsx = {
    read: () => ({ SheetNames: ['users'], Sheets: { users: { '!ref': 'A1:AG2' } } }),
    utils: {
      decode_range: () => ({ s: { r: 0, c: 0 }, e: { r: 1, c: USER_IMPORT_LIMITS.maxColumns } }),
      sheet_to_json: jest.fn(),
    },
  };
  const zipSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer;

  expect(() => parseUserWorkbook(fakeXlsx, zipSignature)).toThrow('too many columns');
  expect(fakeXlsx.utils.sheet_to_json).not.toHaveBeenCalled();
});
