import xaxa from 'eslint-config-xaxa';

export default xaxa({
  wgw: {
    'import/exports-last': 'off',
    'require-unicode-regexp': 'off',
  },
}, {
  files: ['**/*test*/**/*.ts', '**/*.test.ts'],
  rules: {
    'ts/explicit-function-return-type': 'off',
  },
}, {
  files: ['**/*cli.ts'],
  rules: {
    'prefer-reflect': 'off',
  },
});
