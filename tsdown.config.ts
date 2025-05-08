import { defineConfig } from 'tsdown/config';

export default [
  defineConfig({
    dts: true,
    entry: 'src/index.ts',
    format: ['esm', 'cjs'],
    outDir: 'dist',
  }),
  defineConfig({
    entry: 'src/cli.ts',
    external: ['./index.js'],
    format: 'esm',
    outDir: 'dist',
  }),
];
