import readWorkbook from 'read-excel-file/node';
import writeWorkbook from 'write-excel-file/node';
import { parseUserWorkbook, USER_IMPORT_LIMITS } from './AutoImportUsers';
import type { SpreadsheetMatrix } from '../../Utils/spreadsheetXlsx';

const workbookBuffer = async (rows: unknown[][]) => {
  const workbook = writeWorkbook(
    rows.map((row) => row.map((value) => ({ value: value as string | number }))),
    { sheet: 'users' },
  );
  const buffer = await workbook.toBuffer();
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
};

const nodeReader = async (input: ArrayBuffer) =>
  readWorkbook(Buffer.from(input)).then((sheets) =>
    sheets.map(({ sheet, data }) => ({ sheet, data: data as SpreadsheetMatrix })),
  );

it('parses the supported user columns without creating user-controlled object keys', async () => {
  const rows = await parseUserWorkbook(
    nodeReader,
    await workbookBuffer([
      ['username', 'password', 'email', 'studentId', 'banThirdParty'],
      ['alice', 'secret12', 'alice@example.com', 20260001, 1],
    ]),
  );

  expect(rows).toEqual([
    expect.objectContaining({
      username: 'alice',
      password: 'secret12',
      email: 'alice@example.com',
      studentId: 20260001,
      banThirdParty: 1,
    }),
  ]);
  expect(Object.getPrototypeOf(rows[0])).toBe(Object.prototype);
});

it.each(['__proto__', 'prototype', 'constructor'])(
  'rejects the dangerous %s header',
  async (header) => {
    const maliciousReader = jest.fn().mockResolvedValue([
      {
        sheet: 'users',
        data: [
          ['username', 'password', 'email', header],
          ['alice', 'secret12', 'alice@example.com', 'polluted'],
        ],
      },
    ]);
    await expect(
      parseUserWorkbook(maliciousReader, new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer),
    ).rejects.toThrow('unsupported header');
    expect((Object.prototype as any).polluted).toBeUndefined();
  },
);

it('rejects invalid signatures before invoking the parser', async () => {
  const read = jest.fn();
  await expect(parseUserWorkbook(read, new Uint8Array([1, 2, 3, 4]).buffer)).rejects.toThrow(
    'signature',
  );
  expect(read).not.toHaveBeenCalled();
});

it('rejects oversized matrices before materializing rows', async () => {
  const read = jest.fn().mockResolvedValue([
    {
      sheet: 'users',
      data: [Array.from({ length: USER_IMPORT_LIMITS.maxColumns + 1 }, (_, index) => `c${index}`)],
    },
  ]);
  const zipSignature = new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer;

  await expect(parseUserWorkbook(read, zipSignature)).rejects.toThrow('too many columns');
});
