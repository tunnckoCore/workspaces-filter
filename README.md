# workspaces-filter [![npm version][npmv-img]][npmv-url] [![MIT license][license-img]][license-url] [![Libera Manifesto][libera-manifesto-img]][libera-manifesto-url] [![Twitter][twitter-img]][twitter-url]

> A companion for filtering monorepo workspaces, by package name or package dir. Because all package
> manager's are weird. Useful for running scripts on a subset of workspaces. The primary reason is
> because Bun's \"--filter\" feature is buggy, but it's also useful for other package manger, it
> also runs shell scripts using the `execa` package.

[![Code style][codestyle-img]][codestyle-url] [![linux build status][linux-build-img]][build-url]
[![][npm-monthly-img]][npmv-url]

<!-- [![][npm-weekly-img]][npmv-url] -->
<!-- [![][npm-monthly-img]][npmv-url] -->
<!-- [![][npm-yearly-img]][npmv-url] -->
<!-- [![][npm-alltime-img]][npmv-url] -->

## Highlights

The library is especially useful when you need to:

- Programmatically find and filter workspace packages
- Run commands or scripts on a subset of packages
- Execute package manager commands across filtered workspaces
- Run shell commands in specific workspace directories

## Install

```sh
bun add workspaces-filter
npm install workspaces-filter
```

or use the CLI directly:

```sh
bunx workspaces-filter
npx workspaces-filter
pnpm dlx workspaces-filter

# or install globally
npm install -g workspaces-filter
```

## Usage as CLI

```
workspaces-filter/0.5

Usage:
  $ workspaces-filter <pattern> [...command]

Commands:
  <pattern> [...command]  Select by package name or workspace directory

For more info, run any command with the `--help` flag:
  $ workspaces-filter --help

Options:
  --print <mode>                Print the names/folders of selected packages, without running command
  --cwd <dir>                   Current working directory (default: /home/charlike/code/hela)
  --pm, --package-manager <pm>  The package manager to use. Defaults to packageManager from root package.json, or Bun
  -v, --version                 Display version number
  -h, --help                    Display this message

Examples:
workspaces-filter . build   # run in all packages of all workspaces
workspaces-filter _ build   # because the '*' would not work

workspaces-filter '*preset*' build
workspaces-filter '*preset*' add foo-pkg
workspaces-filter '*preset*' add --dev typescript

workspaces-filter './packages/foo' -- echo 'Hello, World!'
workspaces-filter './packages/*preset*' -- pwd

workspaces-filter '*preset*' --print names
workspaces-filter '*preset*' --print json
workspaces-filter '*preset*' --print dirs
```

> ![NOTE]
>
> To run a shell command in selected/filtered packages, use `--` right after the pattern!

## Examples

```sh
npx workspaces-filter '*preset*' build
pnpm dlx workspaces-filter '*preset*' add foo-pkg
bunx workspaces-filter '*preset*' add --dev typescript
```

It checks if there is a script in package's scripts field (thus runs it with `bun run`, `npm run` or
`pnpm run`), if not runs the package manager command (`bun add`, `npm add`), or a shell command if
`_` or `sh` is provided right after the pattern, like so

```sh
bunx workspaces-filter './packages/foo' -- echo 'Hello, World!' # runs `echo 'Hello, World!'` in the `./packages/foo` workspace
bunx workspaces-filter './packages/*preset*' -- pwd # runs `pwd` in each workspace
```

You can run `pnpm dlx` like so

```sh
pnpx workspaces-filter '*preset*' dlx esmc
```

## Using as a Library

The package can also be used programmatically in your Node.js/TypeScript applications:

```ts
import { filter, runCommandOn } from 'workspaces-filter';
```

### Types

```ts
type GraphValue = {
  dir: string; // Relative path to the package directory
  name: string; // Package name from package.json
  version: string; // Package version
  license: string; // Package license
  exports: Record<string, string>; // Package exports field
  scripts: Record<string, string>; // Package scripts
  dependencies: Record<string, string>; // Package dependencies
};

type Graph = Record<string, GraphValue>;
```

### filter(wsGlobs, pattern, cwd?)

Filters workspace packages by name or directory pattern.

- `wsGlobs` - Array of glob patterns for workspace directories (e.g., ['packages/*'])
- `pattern` - String or array of patterns to filter packages by name or directory
- `cwd` - Optional working directory, defaults to process.cwd()
- Returns: Promise<Graph> - Object mapping package names to their metadata

```ts
// Example: Find all packages matching '*preset*' pattern
const graph = await filter(['packages/*'], '*preset*');

// Example: Find packages in multiple patterns
const graph = await filter(['packages/*'], ['foo', 'bar']);

// Example: Find all packages
const graph = await filter(['packages/*'], '*');
```

### runCommandOn(args, graph, options?)

Runs commands on the filtered packages.

- `args` - Array of command arguments to run
- `graph` - Graph object returned from filter()
- `options` - Optional configuration
  - `cwd` - Working directory (default: process.cwd())
  - `isShell` - Whether to run as shell command (default: false)
  - `packageManager` - Package manager to use (default: 'bun')
  - `onTestCallback` - Callback function for test results
- Returns: Promise<Graph> - The input graph object

```ts
// Example: Run build script on filtered packages
const graph = await filter(['packages/*'], '*preset*');
await runCommandOn(['build'], graph);

// Example: Run shell command
await runCommandOn(['echo "test"'], graph, { isShell: true });

// Example: Use specific package manager
await runCommandOn(['install'], graph, { packageManager: 'pnpm' });
```

The library is especially useful when you need to:

- Programmatically find and filter workspace packages
- Run commands or scripts on a subset of packages
- Execute package manager commands across filtered workspaces
- Run shell commands in specific workspace directories

For more examples, check out the [test file](test/index.test.ts).

<!-- prettier-ignore-start -->

[codestyle-url]: https://github.com/tunnckoCore/eslint-config-xaxa
[codestyle-img]: https://badgen-proxy-fixed-cache.deno.dev/badge/code%20style/xaxa/44cc11
[codecov-url]: https://codecov.io/gh/tunnckocore/workspaces-filter
[codecov-img]:
  https://badgen-proxy-fixed-cache.deno.dev/codecov/c/github/tunnckocore/workspaces-filter/master?icon=codecov
[npmv-img]: https://badgen-proxy-fixed-cache.deno.dev/npm/v/workspaces-filter?icon=npm&cache=3
[npmv-url]: https://npmjs.com/package/workspaces-filter
[license-img]: https://badgen-proxy-fixed-cache.deno.dev/npm/license/workspaces-filter
[license-url]: https://github.com/tunnckocore/workspaces-filter/blob/master/LICENSE
[libera-manifesto-url]: https://liberamanifesto.com
[libera-manifesto-img]: https://badgen-proxy-fixed-cache.deno.dev/badge/libera/manifesto/grey
[twitter-url]: https://twitter.com/wgw_lol
[twitter-img]:
  https://badgen-proxy-fixed-cache.deno.dev/badge/twitter/follow/wgw_lol?icon=twitter&color=1da1f2&cache=3

<!-- build status -->

[linux-build-img]:
  https://badgen-proxy-fixed-cache.deno.dev/github/checks/tunnckocore/workspaces-filter/master?icon=github&label=build&cache=3
[build-url]: https://github.com/tunnckocore/workspaces-filter/actions

<!-- npm downloads -->

[npm-weekly-img]:
  https://badgen-proxy-fixed-cache.deno.dev/npm/dw/workspaces-filter?icon=npm&cache=3
[npm-monthly-img]:
  https://badgen-proxy-fixed-cache.deno.dev/npm/dm/workspaces-filter?icon=npm&cache=3
[npm-yearly-img]:
  https://badgen-proxy-fixed-cache.deno.dev/npm/dy/workspaces-filter?icon=npm&cache=3
[npm-alltime-img]:
  https://badgen-proxy-fixed-cache.deno.dev/npm/dt/workspaces-filter?icon=npm&cache=3&label=total%20downloads
