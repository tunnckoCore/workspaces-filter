# workspaces-filter [![npm version][npmv-img]][npmv-url] [![MIT license][license-img]][license-url] [![Libera Manifesto][libera-manifesto-img]][libera-manifesto-url] [![Twitter][twitter-img]][twitter-url]

> A companion for filtering monorepo workspaces, by package name or package dir. Because all package
> manager's are weird. Useful for running scripts on a subset of workspaces. The primary reason is
> because Bun's \"--filter\" feature is buggy, but it's also useful for other package manger, it
> also runs shell scripts using the `execa` package Useful for running scripts on a subset of
> workspaces. The primary reason is because Bun's "--filter" feature is buggy, but it's also useful
> for other package manger, it also runs shell scripts using the `execa` package

[![Code style][codestyle-img]][codestyle-url] [![linux build status][linux-build-img]][build-url]
[![macos build status][macos-build-img]][build-url] [![][npm-monthly-img]][npmv-url]

<!-- [![][npm-weekly-img]][npmv-url] -->
<!-- [![][npm-monthly-img]][npmv-url] -->
<!-- [![][npm-yearly-img]][npmv-url] -->
<!-- [![][npm-alltime-img]][npmv-url] -->

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

## Usage

```
workspaces-filter/0.4

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

<!-- prettier-ignore-start -->

[codestyle-url]: https://github.com/airbnb/javascript
[codestyle-img]:
  https://badgen.net/badge/code%20style/airbnb%20%2B%20prettier/ff5a5f?icon=airbnb&cache=300
[codecov-url]: https://codecov.io/gh/tunnckocore/workspaces-filter
[codecov-img]: https://badgen.net/codecov/c/github/tunnckocore/workspaces-filter/master?icon=codecov
[npmv-img]: https://badgen.net/npm/v/formidable?icon=npm
[npmv-url]: https://npmjs.com/package/formidable
[license-img]: https://badgen.net/npm/license/formidable
[license-url]: https://github.com/tunnckocore/workspaces-filter/blob/master/LICENSE
[libera-manifesto-url]: https://liberamanifesto.com
[libera-manifesto-img]: https://badgen.net/badge/libera/manifesto/grey
[twitter-url]: https://twitter.com/wgw_lol
[twitter-img]: https://badgen.net/badge/twitter/follow/wgw_lol?icon=twitter&color=1da1f2&cache=30

<!-- build status -->

[linux-build-img]:
  https://badgen.net/github/checks/tunnckocore/workspaces-filter/master?label=linux%20build&icon=github
[macos-build-img]:
  https://badgen.net/github/checks/tunnckocore/workspaces-filter/master?label=macos%20build&icon=github
[windows-build-img]:
  https://badgen.net/github/checks/tunnckocore/workspaces-filter/master/windows?cache=300&label=windows%20build&icon=github
[build-url]: https://github.com/tunnckocore/workspaces-filter/actions

<!-- npm downloads -->

[npm-weekly-img]: https://badgen.net/npm/dw/workspaces-filter?icon=npm&cache=1
[npm-monthly-img]: https://badgen.net/npm/dm/workspaces-filter?icon=npm&cache=1
[npm-yearly-img]: https://badgen.net/npm/dy/workspaces-filter?icon=npm&cache=1
[npm-alltime-img]:
  https://badgen.net/npm/dt/workspaces-filter?icon=npm&cache=1&label=total%20downloads
