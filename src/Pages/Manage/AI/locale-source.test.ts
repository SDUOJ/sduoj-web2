import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import en from '../../../Assert/lang/en.json';
import zh from '../../../Assert/lang/zh.json';

it('keeps AI page UI strings translated and locale interpolation contracts aligned', () => {
  const english = en as unknown as Record<string, string>;
  const chinese = zh as unknown as Record<string, string>;
  const failures: string[] = [];
  const directory = path.resolve(process.cwd(), 'src/Pages/Manage/AI');
  for (const file of fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.tsx') && !name.includes('.test.'))) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(path.join(directory, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      if (
        (ts.isStringLiteral(node) || ts.isJsxText(node) || ts.isTemplateExpression(node)) &&
        /[\u3400-\u9fff]/.test(node.getText(source))
      ) {
        failures.push(
          `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1} untranslated UI string`,
        );
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === 't' &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const key = node.arguments[0].text;
        if (!english[key] || !chinese[key]) failures.push(`${file}: missing locale key ${key}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  for (const key of Object.keys(english).filter((key) => key.startsWith('ai'))) {
    expect(chinese[key]).toBeDefined();
    expect(english[key]).not.toMatch(/[\u3400-\u9fff]/);
    const placeholders = (value: string) => (value.match(/{{\s*\w+\s*}}/g) || []).sort();
    expect(placeholders(english[key])).toEqual(placeholders(chinese[key]));
  }
  expect(failures).toEqual([]);
});
