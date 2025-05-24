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

```sh
workspaces-filter/0.8.1

Usage:
  $ workspaces-filter <pattern> [...command]

Commands:
  <pattern> [...command]  Select by package name or workspace directory

For more info, run any command with the `--help` flag:
  $ workspaces-filter --help

Options:
  --print <mode>                Print the names/folders of selected packages, without running command
  --cwd <dir>                   Current working directory (default: /home/charlike/code/mid-april-2025/workspaces-filter)
  --pm, --package-manager <pm>  The package manager to use. Defaults to packageManager from root package.json, or Bun
  -v, --version                 Display version number
  -h, --help                    Display this message

Examples:
workspaces-filter . build   # run in all packages of all workspaces
workspaces-filter _ build   # because the "*" would not work if raw
workspaces-filter '*' build   # should be quoted to avoid shell globbing

workspaces-filter "*preset*" build
workspaces-filter "*preset*" add foo-pkg barry-pkg
workspaces-filter "*preset*" add --dev typescript

workspaces-filter "./packages/foo" -- echo "Hello, World!"
workspaces-filter "./packages/*preset*" -- pwd

workspaces-filter "*preset*" --print names
workspaces-filter "*preset*" --print json
workspaces-filter "*preset*" --print dirs

```

> [!NOTE]
>
> To run a shell command in selected/filtered packages, use `--` right after the pattern!

### Examples

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

### API

<!-- prettier-ignore-start -->
<!-- docks-start -->

_Generated using [docks](https://github.com/tunnckoCore/workspaces-filter/blob/master/docks.ts)._

### [filter](./src/index.ts#L51)

Filters workspace packages based on provided glob patterns and search patterns.

<span id="filter-params"></span>

#### Params

- `wsGlobs` **{Array&lt;string&gt;}** - Array of workspace glob patterns to search for package.json files.
- `pattern` **{Array&lt;string&gt;}** - String or array of strings to filter workspaces by name or directory.
- `cwd`  - Optional current working directory (defaults to `process.cwd()`).

<span id="filter-throws"></span>

#### Throws

- **{Error}** - When no workspace globs are provided.
- **{Error}** - When no pattern is provided.

<span id="filter-returns"></span>

#### Returns

- **{Promise&lt;Graph&gt;}** - Resolving to a Graph object containing filtered workspace metadata.

<span id="filter-examples"></span>

#### Examples

```ts
import { filter } from 'workspaces-filter';

// Filter workspaces matching 'pkg-*' pattern
const graph = await filter(['packages/*'], 'pkg-*');

// Filter multiple patterns
const graph = await filter(['packages/*'], ['pkg-1', 'pkg-2']);

// Filter with package dirs
const graph = await filter(['packages/*'], ['packages/foo']);

// Filter with custom working directory
const graph = await filter(['packages/*'], '*', '/path/to/project');
```

### [runCommandOn](./src/index.ts#L167)

Executes a shell command or a package script in the context of each package in the graph.

<span id="runcommandon-params"></span>

#### Params

- `args` **{Array&lt;string&gt;}** - Arguments to pass to the command.
- `graph` **{Graph}** - Graph object containing package metadata.
- `options` **{RunCommandOnOptions}** - Optional configuration for running the command.

<span id="runcommandon-returns"></span>

#### Returns

- **{Promise&lt;Graph&gt;}** - Resolving to the input graph object.

<span id="runcommandon-examples"></span>

#### Examples

```ts
import { filter, runCommandOn } from 'workspaces-filter';

const graph = await filter(['packages/*'], ['@scope/*']);
console.log(graph);

interface RunCommandOnOptions {
  cwd?: string;
  isShell?: boolean;
  packageManager?: string;
  onTestCallback?: (_err: any, _ok: any) => void | Promise<void>;
}

// Run a shell command in each package
await runCommandOn(['echo', 'Hello, World!'], graph, { isShell: true } as RunCommandOnOptions);

// Run a package script in each package
await runCommandOn(['build'], graph);
```

<!-- docks-end -->
<!-- prettier-ignore-end -->

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
[license-src]: https://img.shields.io/npm/l/workspaces-filter?style=flat&colorB=blue
[license-href]: https://github.com/tunnckocore/workspaces-filter/blob/master/LICENSE
[codestyle-src]: https://badgen.net/badge/code%20style/xaxa/44cc11?icon=airbnb
[codestyle-href]: https://github.com/tunnckoCore/eslint-config-xaxa

<!-- prettier-ignore-end -->
