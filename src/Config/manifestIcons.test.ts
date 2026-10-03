import fs from 'node:fs';
import path from 'node:path';

type ManifestIcon = {
  src: string;
  sizes?: string;
  type?: string;
};

type WebManifest = {
  icons?: ManifestIcon[];
};

const publicDirectory = path.resolve(process.cwd(), 'public');
const manifestPath = path.join(publicDirectory, 'manifest.json');

const readPngDimensions = (content: Buffer) => {
  if (content.length < 24 || content.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('invalid PNG signature');
  }
  return {
    width: content.readUInt32BE(16),
    height: content.readUInt32BE(20),
  };
};

const readIcoDimensions = (content: Buffer) => {
  if (content.length < 6 || content.readUInt16LE(0) !== 0 || content.readUInt16LE(2) !== 1) {
    throw new Error('invalid ICO header');
  }
  const count = content.readUInt16LE(4);
  const dimensions = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    if (offset + 2 > content.length) throw new Error('truncated ICO directory');
    const width = content[offset] || 256;
    const height = content[offset + 1] || 256;
    dimensions.add(`${width}x${height}`);
  }
  return dimensions;
};

const declaredSizes = (sizes?: string) =>
  new Set(
    (sizes ?? '')
      .split(/\s+/)
      .map((size) => size.trim())
      .filter(Boolean),
  );

describe('PWA manifest icons', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as WebManifest;

  it('references local icon files with matching formats and dimensions', () => {
    expect(manifest.icons).toEqual(expect.arrayContaining([expect.any(Object)]));

    for (const icon of manifest.icons ?? []) {
      expect(icon.src).not.toMatch(/^(?:[a-z]+:)?\/\//i);
      expect(icon.src).not.toContain('?');
      expect(icon.src).not.toContain('#');

      const iconPath = path.resolve(publicDirectory, icon.src);
      expect(path.relative(publicDirectory, iconPath)).not.toMatch(/^\.\.(?:[\\/]|$)/);
      expect(fs.statSync(iconPath).isFile()).toBe(true);

      const content = fs.readFileSync(iconPath);
      expect(['image/png', 'image/x-icon']).toContain(icon.type);
      const dimensions =
        icon.type === 'image/png'
          ? (() => {
              const { width, height } = readPngDimensions(content);
              return new Set([`${width}x${height}`]);
            })()
          : readIcoDimensions(content);

      expect(Array.from(declaredSizes(icon.sizes)).some((size) => dimensions.has(size))).toBe(true);
    }
  });
});
