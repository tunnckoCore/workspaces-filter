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
