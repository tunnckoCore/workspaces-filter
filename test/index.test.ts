import { afterAll, beforeAll, test } from 'bun:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { filter, runCommandOn } from '../src/index';

// Helper to create temporary test workspace
async function createTempWorkspace() {
  const monorepo = path.join(process.cwd(), 'test', 'monorepo');
  await fs.mkdir(monorepo, { recursive: true });

  // Create mock package.json files
  const packages = [
    { name: '@scope/foo', version: '1.0.0', scripts: { test: 'echo running-foo-test-script' } },
    { name: '@scope/bar', version: '2.1.0', scripts: { build: 'echo bar' } },
    { name: 'baz-utils', version: '0.2.3', scripts: { dev: 'echo bazutils' } },
    { name: 'baz-preset', version: '0.1.0', scripts: { dev: 'echo baz' } },
  ];

  for (const pkg of packages) {
    const pkgDir = path.join(monorepo, 'packages', pkg.name.replace('@scope/', ''));
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2));
  }

  // Create root package.json with workspaces
  await fs.writeFile(
    path.join(monorepo, 'package.json'),
    JSON.stringify(
      {
        name: 'root',
        workspaces: ['packages/*'],
        private: true,
      },
      null,
      2,
    ),
  );

  return monorepo;
}

let monorepoRoot: string;

beforeAll(async () => {
  monorepoRoot = await createTempWorkspace();
});

afterAll(async () => {
  await fs.rm(monorepoRoot, { recursive: true, force: true });
});

test('filter() should throw when no workspace globs provided', async () => {
  await assert.rejects(() => filter([], 'foo'), /No workspace globs provided/);
});

test('filter() should throw when no pattern provided', async () => {
  await assert.rejects(() => filter(['packages/*'], ''), /No pattern provided/);
  await assert.rejects(() => filter(['packages/*'], []), /No pattern provided/);
  await assert.rejects(() => filter(['packages/*'], ['']), /No pattern provided/);
});

test('filter() should find packages by name pattern', async () => {
  const graph = await filter(['packages/*'], '*preset*', monorepoRoot);

  assert.equal(Object.keys(graph).length, 1);
  assert.ok('baz-preset' in graph);
  assert.equal(graph['baz-preset'].version, '0.1.0');
});

test('filter() should find packages by directory pattern', async () => {
  const graph = await filter(['packages/*'], 'foo', monorepoRoot);

  assert.equal(Object.keys(graph).length, 1);
  assert.ok('@scope/foo' in graph);
  assert.equal(graph['@scope/foo'].version, '1.0.0');
});

test('filter() should find all packages with wildcard', async () => {
  const graph = await filter(['packages/*'], '.', monorepoRoot);
  const graph2 = await filter(['packages/*'], '*', monorepoRoot);

  assert.equal(Object.keys(graph).length, 4);
  assert.ok('@scope/foo' in graph);
  assert.ok('@scope/bar' in graph);
  assert.ok('baz-preset' in graph);
  assert.ok('baz-utils' in graph);

  assert.ok('@scope/foo' in graph2);
  assert.ok('@scope/bar' in graph2);
  assert.ok('baz-preset' in graph2);
  assert.ok('baz-utils' in graph2);
});

test('filter() should handle scoped package names', async () => {
  const graph = await filter(['packages/*'], '@scope/*', monorepoRoot);

  assert.equal(Object.keys(graph).length, 2);
  assert.ok('@scope/foo' in graph);
  assert.ok('@scope/bar' in graph);
});

test('runCommandOn() should execute package scripts', async () => {
  const graph = await filter(['packages/*'], '@scope/foo', monorepoRoot);

  // Mock console.log to capture output
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args) => {
    logs.push(args.join(' '));
  };

  await runCommandOn(['test'], graph, {
    cwd: monorepoRoot,
    packageManager: 'bun',
    onTestCallback: (err) => {
      assert.equal(err, null, 'should not have error');
    },
  });

  // Restore console.log
  console.log = originalLog;

  assert.ok(logs.some((log) => log.includes('Running in')));
});

test('runCommandOn() should handle shell commands', async () => {
  const graph = await filter(['packages/*'], 'baz-preset', monorepoRoot);

  await runCommandOn(['echo ran-through-runCommandOn'], graph, {
    cwd: monorepoRoot,
    packageManager: 'bun',
    isShell: true,
    onTestCallback: (err) => {
      assert.equal(err, null, 'should not have error');
    },
  });

  assert.ok(true);
});

test('runCommandOn() should fail gracefully on failing commands/scripts', async () => {
  const graph = await filter(['packages/*'], 'baz-preset', monorepoRoot);
  const opts = {
    cwd: monorepoRoot,
    packageManager: 'bun',
    onTestCallback: (err) => {
      assert.ok(err instanceof Error, 'should have error');
    },
  };

  await runCommandOn(['nonexistent-script'], graph, opts);
  await runCommandOn(['foobarbaz-qux-no-command'], graph, { ...opts, isShell: true });
  assert.ok(true);
});
