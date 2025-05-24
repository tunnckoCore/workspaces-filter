// SPDX-License-Identifier: MIT

import { shell } from '@tunnckocore/execa';
import fastGlob from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import proc from 'node:process';
import picomatch from 'picomatch';

export interface GraphValue {
  dir: string;
  name: string;
  version: string;
  license: string;
  exports: Record<string, string>;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
}

export type Graph = Record<string, GraphValue>;

/**
 * Filters workspace packages based on provided glob patterns and search patterns.
 *
 * @example
 * import { filter } from 'workspaces-filter';
 *
 * // Filter workspaces matching 'pkg-*' pattern
 * const graph = await filter(['packages/*'], 'pkg-*');
 *
 * // Filter multiple patterns
 * const graph = await filter(['packages/*'], ['pkg-1', 'pkg-2']);
 *
 * // Filter with package dirs
 * const graph = await filter(['packages/*'], ['packages/foo']);
 *
 * // Filter with custom working directory
 * const graph = await filter(['packages/*'], '*', '/path/to/project');
 *
 *
 * @param {string|string[]} wsGlobs - Array of workspace glob patterns to search for package.json files.
 * @param {string|string[]} pattern - String or array of strings to filter workspaces by name or directory.
 * @param {string} [cwd] - Optional current working directory (defaults to `process.cwd()`).
 *
 * @throws {Error} When no workspace globs are provided.
 * @throws {Error} When no pattern is provided.
 *
 * @returns {Promise<Graph>} Resolving to a Graph object containing filtered workspace metadata.
 * @public
 */
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

  if (pattern.length === 0) {
    throw new Error('No pattern provided.');
  }

  cwd = cwd || proc.cwd();
  const stream = fastGlob.stream(
    wsGlobs.map((workspaceGlob: string) => `${workspaceGlob}/package.json`),
    { absolute: true, cwd },
  );

  const workspaces: Record<string, GraphValue> = {};

  for await (const pkgJsonPath of stream) {
    const pkgRoot = path.dirname(pkgJsonPath as string);
    const pkgJsonStr = await fs.readFile(pkgJsonPath, 'utf8');
    const {
      dependencies = {},
      exports = {},
      license = '',
      name,

      scripts = {},
      version = '0.0.0',
    } = JSON.parse(pkgJsonStr);

    const pkg = {
      dependencies,
      exports,
      license,
      name,
      scripts,
      version,
    } as {
      name: string;
      version: string;
      license: string;
      exports: Record<string, string>;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
    };
    workspaces[pkg.name] = {
      dir: path.relative(cwd, pkgRoot),
      ...pkg,
    };
  }

  if (
    pattern.find((p) => p.trim() === '.')
    || pattern.find((p) => p.trim() === '*')
  ) {
    return workspaces as Graph;
  }

  const isMatch = picomatch(pattern.map((p) => p.replaceAll('/', '.')));

  const graph = Object.fromEntries(
    Object.entries(workspaces).filter(([name, meta]: [string, GraphValue]) => {
      const hasMatch
        = pattern.some((p) => name.includes(p))
          || pattern.some((p) => meta.dir.includes(p))
          || isMatch(name.replaceAll('/', '.'))
          || isMatch(meta.dir);

      return hasMatch;
    }),
  );

  return graph as Graph;
}

export interface RunCommandOnOptions {
  cwd: string;
  isShell: boolean;
  packageManager: string;
  onTestCallback: (_err: any, _ok: any) => void | Promise<void>;
}

/**
 * Executes a shell command or a package script in the context of each package in the graph.
 *
 * @example
 * import { filter, runCommandOn } from 'workspaces-filter';
 *
 * const graph = await filter(['packages/*'], ['@scope/*']);
 * console.log(graph);
 *
 * type RunCommandOnOptions = {
 *   cwd?: string;
 *   isShell?: boolean;
 *   packageManager?: string;
 *   onTestCallback?: (_err: any, _ok: any) => void | Promise<void>;
 * };
 *
 * // Run a shell command in each package
 * await runCommandOn(['echo', 'Hello, World!'], graph, { isShell: true } as RunCommandOnOptions);
 *
 * // Run a package script in each package
 * await runCommandOn(['build'], graph);
 *
 * @param {string[]} args - Arguments to pass to the command.
 * @param {Graph} graph - Graph object containing package metadata.
 * @param {RunCommandOnOptions} options - Optional configuration for running the command.
 * @returns {Promise<Graph>} Resolving to the input graph object.
 * @public
 */
export async function runCommandOn(
  args: string[],
  graph: Graph,
  options?: Partial<RunCommandOnOptions>,
): Promise<Graph> {
  const opts = {
    cwd: proc.cwd(),
    isShell: false,
    onTestCallback: () => {},
    onTestCallbackcwd: proc.cwd(),
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
          await shell(args.join(' '), { cwd: pkgDir, stdout: 'inherit' });
          await opts.onTestCallback(null, true);
        } catch (err: unknown) {
          console.error((err as Error).stack);
          await opts.onTestCallback(err, false);
        }
        return;
      }

      const [script, ...argz] = args;
      const isScript = Boolean(meta.scripts[script || '_____$$$__']);

      const cmd = [
        opts.packageManager,
        isScript ? 'run' : '',
        script,
        ...argz,
      ].filter(Boolean);

      // console.log('Running in "%s" (%s)', meta.dir, meta.name);

      try {
        await shell(cmd.join(' '), { cwd: pkgDir, stdout: 'inherit' });
        await opts.onTestCallback(null, true);
      } catch (err: unknown) {
        console.error((err as Error).stack);
        await opts.onTestCallback(err, false);
      }
    }),
  );

  return graph;
}
