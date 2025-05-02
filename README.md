# workspaces-filter

> A companion for filtering monorepo workspaces, by package name or package dir. Because all package
> manager's are weird. Useful for running scripts on a subset of workspaces. The primary reason is
> because Bun's --filter feature is buggy, but it's also useful for other package manger, it also
> runs shell scripts using the `execa` package.

<!-- prettier-ignore-start -->

[![][npm-version-src]][npm-version-href]
[![][github-actions-src]][github-actions-href]
[![][codecov-src]][codecov-href]
[![][npm-downloads-src]][npm-downloads-href]
[![][codestyle-src]][codestyle-href]
[![][license-src]][license-href]

<!-- prettier-ignore-end -->

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

- `wsGlobs` - The array of your pkg.workspaces or pnpm-workspaces (e.g., ['packages/*'])
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

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT)

<!-- prettier-ignore-start -->

[npm-version-src]: https://img.shields.io/npm/v/workspaces-filter?style=flat&logo=npm
[npm-version-href]: https://npmjs.com/package/workspaces-filter
[npm-downloads-src]: https://img.shields.io/npm/dm/workspaces-filter?style=flat&logo=npm
[npm-downloads-href]: https://npmjs.com/package/workspaces-filter
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/tunnckoCore/workspaces-filter/ci.yml?style=flat&logo=github
[github-actions-href]: https://github.com/tunnckocore/workspaces-filter/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/tunnckocore/workspaces-filter/master?style=flat&logo=codecov
[codecov-href]: https://codecov.io/gh/tunnckocore/workspaces-filter
[bundle-src]: https://img.shields.io/bundlephobia/minzip/workspaces-filter?style=flat
[bundle-href]: https://bundlephobia.com/result?p=workspaces-filter
[license-src]: https://img.shields.io/github/license/tunnckocore/workspaces-filter.svg?style=flat&colorB=blue
[license-href]: https://github.com/tunnckocore/workspaces-filter/blob/master/LICENSE
[codestyle-src]: https://badgen.net/badge/code%20style/xaxa/44cc11?icon=airbnb
[codestyle-href]: https://github.com/tunnckoCore/eslint-config-xaxa

<!-- prettier-ignore-end -->
