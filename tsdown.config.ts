import fs from 'node:fs';
import { defineConfig } from 'tsdown/config';

export default [
  defineConfig({
    entry: 'src/index.ts',
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
  }),
  defineConfig({
    entry: 'src/cli.ts',
    outDir: 'dist',
    format: 'esm',
    external: ['./index.js'],
  }),
];

fs.writeFileSync('./dist/index.d.cts', 'export type * from \'./index.d.ts\';\n');
