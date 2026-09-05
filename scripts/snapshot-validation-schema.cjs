const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const prettier = require('prettier');

function columns(container, include) {
  const query =
    'SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,CHARACTER_SET_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,COLUMN_NAME';
  const output = execFileSync(
    'docker',
    [
      ...(process.platform === 'darwin' ? ['--context', 'desktop-linux'] : []),
      'exec',
      container,
      'sh',
      '-c',
      `MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot --batch --raw -e "${query}" "$MYSQL_DATABASE"`,
    ],
    { encoding: 'utf8' },
  );
  const tables = {};
  for (const line of output.trim().split('\n').slice(1)) {
    const [table, column, type, nullable, charset] = line.split('\t');
    if (!include(table)) continue;
    (tables[table] ??= {})[column] = [
      type,
      nullable === 'YES',
      charset === 'NULL' ? null : charset,
    ];
  }
  return tables;
}

(async () => {
  const schema = {
    oj: columns('sduoj-dev-mysql-1', (table) => table.startsWith('oj_')),
    autolab: columns('sduoj-dev-autolab-mysql-1', () => true),
  };
  const file = 'src/Config/validation/database.json';
  fs.mkdirSync('src/Config/validation', { recursive: true });
  fs.writeFileSync(
    file,
    await prettier.format(JSON.stringify(schema), {
      parser: 'json',
      ...(await prettier.resolveConfig(file)),
    }),
  );
  const exported = JSON.parse(
    execFileSync(process.env.AUTOLAB_PYTHON || 'python', ['scripts/export-autolab-contracts.py'], {
      encoding: 'utf8',
      env: { ...process.env, SDUOJ_MODE: 'debug' },
    }),
  );
  const allowed = [
    'type',
    'format',
    'pattern',
    '$ref',
    'required',
    'enum',
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'minLength',
    'maxLength',
    'minItems',
    'maxItems',
    'nullable',
  ];
  const clean = (schema) => {
    if (typeof schema !== 'object' || schema === null) return schema;
    const result = Object.fromEntries(
      allowed.filter((key) => key in schema).map((key) => [key, schema[key]]),
    );
    if (schema.properties)
      result.properties = Object.fromEntries(
        Object.entries(schema.properties).map(([key, value]) => [key, clean(value)]),
      );
    for (const key of ['items', 'additionalProperties'])
      if (key in schema) result[key] = clean(schema[key]);
    for (const key of ['allOf', 'anyOf', 'oneOf'])
      if (schema[key]) result[key] = schema[key].map(clean);
    return result;
  };
  const needed = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string') {
      const name = value.$ref.split('/').pop();
      if (!needed.has(name)) {
        needed.add(name);
        visit(exported.components.schemas[name]);
      }
    }
    Object.values(value).forEach(visit);
  };
  visit(exported.routes);
  const spec = {
    routes: exported.routes,
    components: {
      schemas: Object.fromEntries(
        [...needed].sort().map((name) => [name, clean(exported.components.schemas[name])]),
      ),
    },
  };
  const specFile = 'src/Config/validation/autolab.json';
  fs.writeFileSync(
    specFile,
    await prettier.format(JSON.stringify(spec), {
      parser: 'json',
      ...(await prettier.resolveConfig(specFile)),
    }),
  );
  const response = await fetch(
    'http://127.0.0.1:8848/nacos/v1/cs/configs?tenant=dev&group=DEFAULT_GROUP&dataId=problem-service.yml',
    { signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok) throw new Error('Cannot read local problem-service upload configuration');
  const multipart = (await response.json()).spring?.servlet?.multipart;
  const bytes = (value) => {
    if (value === undefined || String(value) === '-1') return null;
    const match = /^(\d+)(B|KB|MB|GB|TB)?$/i.exec(String(value));
    if (!match) throw new Error(`Unsupported Spring DataSize: ${value}`);
    return (
      Number(match[1]) *
      { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }[
        match[2]?.toUpperCase() || 'B'
      ]
    );
  };
  const transport = {
    checkpointUpload: {
      source: 'dev/DEFAULT_GROUP/problem-service.yml spring.servlet.multipart',
      maxFileBytes: bytes(multipart?.['max-file-size']),
      maxRequestBytes: bytes(multipart?.['max-request-size']),
    },
  };
  fs.writeFileSync(
    'src/Config/validation/transport.json',
    await prettier.format(JSON.stringify(transport), { parser: 'json' }),
  );
  console.log(
    `Exported column metadata only: ${Object.keys(schema.oj).length} OJ tables, ${Object.keys(schema.autolab).length} Autolab tables.`,
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
