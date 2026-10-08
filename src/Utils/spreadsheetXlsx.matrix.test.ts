import { zipSync } from 'fflate';
import {
  hasXlsxSignature,
  matrixToRecords,
  parseXlsxMatrices,
  SPREADSHEET_LIMITS,
  SpreadsheetSheet,
} from './spreadsheetXlsx';

const asArrayBuffer = (value: Uint8Array) =>
  value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;

describe('spreadsheet import accept/reject matrix', () => {
  it('accepts a PK zip signature and rejects other magic bytes', () => {
    expect(hasXlsxSignature(asArrayBuffer(new Uint8Array([0x50, 0x4b, 0x03, 0x04])))).toBe(true);
    expect(hasXlsxSignature(asArrayBuffer(new Uint8Array([0x00, 0x01, 0x02, 0x03])))).toBe(false);
  });

  it.each([
    ['empty buffer', new Uint8Array(0), 'size is outside'],
    ['non-PK payload', new Uint8Array([1, 2, 3, 4]), 'signature is invalid'],
  ])('rejects workbook input: %s', async (_label, bytes, fragment) => {
    const reader = jest.fn();
    await expect(parseXlsxMatrices(reader, asArrayBuffer(bytes))).rejects.toThrow(fragment);
    expect(reader).not.toHaveBeenCalled();
  });

  it('rejects oversized and multi-sheet workbooks after a valid archive', async () => {
    const ok = zipSync({ 'xl/worksheets/sheet1.xml': new Uint8Array([1]) });
    const readerTooMany = jest.fn().mockResolvedValue(
      Array.from({ length: SPREADSHEET_LIMITS.maxSheets + 1 }, (_, index) => ({
        sheet: `s${index}`,
        data: [['h']],
      })),
    );
    await expect(parseXlsxMatrices(readerTooMany, asArrayBuffer(ok))).rejects.toThrow(
      'too many sheets',
    );

    const readerRows = jest.fn().mockResolvedValue([
      {
        sheet: 's',
        data: [['h'], ...Array.from({ length: SPREADSHEET_LIMITS.maxRows + 1 }, () => ['x'])],
      },
    ]);
    await expect(parseXlsxMatrices(readerRows, asArrayBuffer(ok))).rejects.toThrow('too many rows');
  });

  it('rejects unsafe sheet names and oversized cells', async () => {
    const ok = zipSync({ 'xl/worksheets/sheet1.xml': new Uint8Array([1]) });
    await expect(
      parseXlsxMatrices(
        jest.fn().mockResolvedValue([{ sheet: '__proto__', data: [['h']] }]),
        asArrayBuffer(ok),
      ),
    ).rejects.toThrow('unsafe');
    await expect(
      parseXlsxMatrices(
        jest.fn().mockResolvedValue([
          {
            sheet: 'ok',
            data: [['h'], ['x'.repeat(SPREADSHEET_LIMITS.maxCellCharacters + 1)]],
          },
        ]),
        asArrayBuffer(ok),
      ),
    ).rejects.toThrow('oversized cell');
  });

  it.each([
    ['unsupported header', [['username', 'evil']], new Set(['username']), ['username']],
    ['duplicate header', [['username', 'username']], new Set(['username']), ['username']],
    ['missing required', [['active']], new Set(['username', 'active']), ['username']],
  ])('rejects matrix construction: %s', (_label, matrix, allowed, required) => {
    expect(() => matrixToRecords(matrix as any, allowed, required)).toThrow();
  });

  it.each([
    ['strings', [['username'], ['alice']], ['username'], [{ username: 'alice' }]],
    ['numbers', [['score'], [42]], ['score'], [{ score: 42 }]],
    ['booleans', [['active'], [false]], ['active'], [{ active: false }]],
    [
      'null cells',
      [
        ['username', 'active'],
        ['alice', null],
      ],
      ['username'],
      [{ username: 'alice', active: null }],
    ],
  ])('maps allowlisted primitive cells: %s', (_label, matrix, required, expected) => {
    expect(
      matrixToRecords(matrix as any, new Set(['username', 'score', 'active']), required),
    ).toEqual(expected);
  });

  it('returns an empty list for a header-only matrix', () => {
    expect(matrixToRecords([['username']], new Set(['username']), ['username'])).toEqual([]);
    expect(matrixToRecords([], new Set(['username']), ['username'])).toEqual([]);
  });
});
