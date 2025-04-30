import fs from 'node:fs/promises';
import path from 'node:path';
import proc from 'node:process';
import { shell } from '@tunnckocore/execa';
import fastGlob from 'fast-glob';
import picomatch from 'picomatch';

export type GraphValue = {
  dir: string;
  name: string;
  version: string;
  license: string;
  exports: Record<string, string>;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
};

export type Graph = Record<string, GraphValue>;

export async function filter(
  wsGlobs: string[],
  pattern: string | string[],
  cwd?: string,
): Promise<Graph> {
  if (!wsGlobs || (wsGlobs && Array.isArray(wsGlobs) && wsGlobs.length === 0)) {
    throw new Error('No workspace globs provided.');
  }
  pattern = Array.isArray(pattern) ? pattern : [pattern];
  pattern = pattern.filter(Boolean);

  if (pattern?.length === 0) {
    throw new Error('No pattern provided.');
  }

  cwd = cwd || proc.cwd();
  const stream = fastGlob.stream(
    wsGlobs.map((workspaceGlob: string) => `${workspaceGlob}/package.json`),
    { cwd, absolute: true },
  );

  const workspaces: Record<string, GraphValue> = {};

  for await (const pkgJsonPath of stream) {
    const pkgRoot = path.dirname(pkgJsonPath as string);
    const {
      name,
      version = '0.0.0',
      license = '',
      // eslint-disable-next-line unicorn/prefer-module
      exports = {},
      scripts = {},
      dependencies = {},
    } = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));

    const pkg = {
      name,
      version,
      license,
      exports,
      scripts,
      dependencies,
    };
    workspaces[pkg.name] = {
      dir: path.relative(cwd, pkgRoot),
      ...pkg,
    };
  }

  if (pattern.find((p) => p === '.') || pattern.find((p) => p === '*')) {
    return workspaces as Graph;
  }

  const isMatch = picomatch(pattern.map((p) => p.replaceAll('/', '.')));

  const graph = Object.fromEntries(
    Object.entries(workspaces).filter(([name, meta]: any) => {
      const hasMatch =
        name.includes(pattern) ||
        meta.dir.includes(pattern) ||
        isMatch(name.replaceAll('/', '.')) ||
        isMatch(meta.dir);

      return hasMatch;
    }),
  );

  return graph as Graph;
}

export async function runCommandOn(
  args: string[],
  graph: Graph,
  options?: Partial<{
    cwd: string;
    isShell: boolean;
    packageManager: string;
    onTestCallback: (err: any, ok: any) => void;
  }>,
): Promise<Graph> {
  const opts = {
    cwd: proc.cwd(),
    onTestCallback: () => {},
    onTestCallbackcwd: proc.cwd(),
    isShell: false,
    packageManager: 'bun',
    ...options,
  };

  await Promise.all(
    Object.values(graph).map(async (x) => {
      // const name = x[0];
      const meta = x;

      const pkgDir = path.join(opts.cwd, meta.dir);

      if (opts.isShell) {
        try {
          await shell(args.join(' '), { stdout: 'inherit', cwd: pkgDir });
          await opts.onTestCallback?.(null, true);
        } catch (err: any) {
          console.error(err.stack);
          await opts.onTestCallback?.(err, false);
        }
        return;
      }

      const [script, ...argz] = args;
      const isScript = Boolean(meta.scripts[script || '_____$$$__']);

      const cmd = [opts.packageManager, isScript ? 'run' : '', script, ...argz].filter(Boolean);

      console.log('Running in "%s" (%s)', meta.dir, meta.name);

      try {
        await shell(cmd.join(' '), { stdout: 'inherit', cwd: pkgDir });
        await opts.onTestCallback?.(null, true);
      } catch (err: any) {
        console.error(err.stack);
        await opts.onTestCallback?.(err, false);
      }
    }),
  );

  return graph;
}
