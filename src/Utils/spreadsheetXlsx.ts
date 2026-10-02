export type SpreadsheetCell = string | number | boolean | Date | null;
export type SpreadsheetMatrix = SpreadsheetCell[][];
export type SpreadsheetSheet = { sheet: string; data: SpreadsheetMatrix };

export const SPREADSHEET_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxSheets: 5,
  maxRows: 5000,
  maxColumns: 32,
  maxCellCharacters: 32767,
  maxArchiveEntries: 256,
  maxUncompressedBytes: 64 * 1024 * 1024,
} as const;

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export const hasXlsxSignature = (input: ArrayBuffer) => {
  const bytes = new Uint8Array(input);
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
};

export const validateXlsxArchive = async (input: ArrayBuffer) => {
  const { Unzip, UnzipInflate } = await import('fflate');
  let entries = 0;
  let totalBytes = 0;
  const unzip = new Unzip((file) => {
    entries += 1;
    totalBytes += file.originalSize ?? 0;
    if (
      entries > SPREADSHEET_LIMITS.maxArchiveEntries ||
      totalBytes > SPREADSHEET_LIMITS.maxUncompressedBytes
    ) {
      throw new Error('Workbook archive exceeds the allowed expansion limits');
    }
  });
  unzip.register(UnzipInflate);
  unzip.push(new Uint8Array(input), true);
};

export async function parseXlsxMatrices(
  readWorkbook: (input: ArrayBuffer) => Promise<SpreadsheetSheet[]>,
  input: ArrayBuffer,
  limits = SPREADSHEET_LIMITS,
) {
  if (input.byteLength === 0 || input.byteLength > limits.maxBytes) {
    throw new Error('Workbook size is outside the allowed range');
  }
  if (!hasXlsxSignature(input)) throw new Error('Workbook signature is invalid');
  await validateXlsxArchive(input);

  const sheets = await readWorkbook(input);
  if (sheets.length === 0 || sheets.length > limits.maxSheets) {
    throw new Error('Workbook contains too many sheets');
  }
  for (const { sheet, data } of sheets) {
    if (!sheet || DANGEROUS_KEYS.has(sheet)) throw new Error('Workbook sheet name is unsafe');
    if (data.length > limits.maxRows + 1) throw new Error('Workbook contains too many rows');
    if (data.some((row) => row.length > limits.maxColumns)) {
      throw new Error('Workbook contains too many columns');
    }
    if (
      data.some((row) =>
        row.some((value) => typeof value === 'string' && value.length > limits.maxCellCharacters),
      )
    ) {
      throw new Error('Workbook contains an oversized cell');
    }
  }
  return sheets;
}

export function matrixToRecords(
  matrix: SpreadsheetMatrix,
  allowedHeaders: ReadonlySet<string>,
  requiredHeaders: readonly string[],
): Record<string, SpreadsheetCell>[] {
  if (matrix.length === 0) return [];
  const rawHeaders = matrix[0];
  const lastHeader = rawHeaders.reduce<number>(
    (last, value, index) => (value === null || value === '' ? last : index),
    -1,
  );
  const headers = rawHeaders.slice(0, lastHeader + 1).map((value) => String(value ?? '').trim());
  if (headers.length === 0 || new Set(headers).size !== headers.length) {
    throw new Error('Workbook headers are empty or duplicated');
  }
  if (
    headers.some((header) => !header || DANGEROUS_KEYS.has(header) || !allowedHeaders.has(header))
  ) {
    throw new Error('Workbook contains an unsupported header');
  }
  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error('Workbook is missing a required header');
  }

  return matrix
    .slice(1)
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null])),
    );
}

const exportValue = (value: unknown): string | number | boolean | Date => {
  if (value instanceof Date || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as string | number | boolean | Date;
  }
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
};

export async function downloadXlsxRecords(
  records: Record<string, unknown>[],
  fileName: string,
  sheet = 'Sheet1',
) {
  const { default: writeWorkbook } = await import('write-excel-file/browser');
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  const data = [
    headers.map((value) => ({ value })),
    ...records.map((record) => headers.map((header) => ({ value: exportValue(record[header]) }))),
  ];
  await writeWorkbook(data, { sheet }).toFile(fileName);
}
