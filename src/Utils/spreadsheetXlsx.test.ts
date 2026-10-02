import { zipSync } from 'fflate';
import {
  matrixToRecords,
  parseXlsxMatrices,
  SPREADSHEET_LIMITS,
  SpreadsheetSheet,
} from './spreadsheetXlsx';

const asArrayBuffer = (value: Uint8Array) =>
  value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;

it('rejects a workbook archive whose expanded entries exceed the limit', async () => {
  const compressed = zipSync({
    'xl/worksheets/sheet1.xml': new Uint8Array(SPREADSHEET_LIMITS.maxUncompressedBytes + 1),
  });
  const reader = jest.fn<Promise<SpreadsheetSheet[]>, [ArrayBuffer]>();

  await expect(parseXlsxMatrices(reader, asArrayBuffer(compressed))).rejects.toThrow(
    'expansion limits',
  );
  expect(reader).not.toHaveBeenCalled();
});

it('rejects unsupported and duplicated headers before constructing records', () => {
  expect(() =>
    matrixToRecords(
      [
        ['username', '__proto__'],
        ['alice', 'polluted'],
      ],
      new Set(['username']),
      ['username'],
    ),
  ).toThrow('unsupported header');
  expect(() =>
    matrixToRecords([['username', 'username']], new Set(['username']), ['username']),
  ).toThrow('duplicated');
});

it('maps only allowlisted headers and preserves primitive cell values', () => {
  expect(
    matrixToRecords(
      [
        ['username', 'active'],
        ['alice', true],
      ],
      new Set(['username', 'active']),
      ['username'],
    ),
  ).toEqual([{ username: 'alice', active: true }]);
});
