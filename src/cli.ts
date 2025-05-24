#!/usr/bin/env node

// SPDX-License-Identifier: MIT

import cac from 'cac';
import dargs from 'dargs';
import fs from 'node:fs/promises';
import path from 'node:path';
import proc from 'node:process';

import { filter, runCommandOn } from './index.ts';

const cli = cac('workspaces-filter').version('0.8.1');

cli
  .command('<pattern> [...command]', 'Select by package name or workspace directory', {
    allowUnknownOptions: true,
  })
  .example('workspaces-filter . build   # run in all packages of all workspaces')
  .example('workspaces-filter _ build   # because the "*" would not work if raw')
  .example('workspaces-filter \'*\' build   # should be quoted to avoid shell globbing')
  .example('')
  .example('workspaces-filter "*preset*" build')
  .example('workspaces-filter "*preset*" add foo-pkg barry-pkg')
  .example('workspaces-filter "*preset*" add --dev typescript')
  .example('')
  .example('workspaces-filter "./packages/foo" -- echo "Hello, World!"')
  .example('workspaces-filter "./packages/*preset*" -- pwd')
  .example('')
  .example('workspaces-filter "*preset*" --print names')
  .example('workspaces-filter "*preset*" --print json')
  .example('workspaces-filter "*preset*" --print dirs')
  .example('')
  .option('--print <mode>', 'Print the names/folders of selected packages, without running command')
  .option('--cwd <dir>', 'Current working directory', { default: proc.cwd() })
  .option(
    '--pm, --package-manager <pm>',
    'The package manager to use. Defaults to packageManager from root package.json, or Bun',
  )
  .action(async (pattern, command, options) => {
    const opts = { ...options };

    if (opts['--'].length === 0 && command.length === 0 && !opts.print) {
      cli.outputHelp();
      return;
    }

    const flags = { ...options };

    delete flags.print;
    delete flags.cwd;
    delete flags.pm;
    delete flags['package-manager'];
    delete flags.packageManager;

    const flagged = dargs(flags, { useEquals: false });
    if (flagged[0] === '--') {
      flagged.shift();
    }

    const rootPkgJson = JSON.parse(await fs.readFile(path.join(opts.cwd, 'package.json'), 'utf8'));
    opts.packageManager = opts.packageManager || rootPkgJson.packageManager?.split('@')?.[0] || 'bun';
    opts.pm = opts.packageManager;

    opts.isShell = command.length === 0;

    // // console.log({ opts });
    let workspaces = rootPkgJson.workspaces;

    // handle bun workspaces
    workspaces = rootPkgJson.workspaces?.packages || rootPkgJson.workspace?.packages || workspaces;

    if (opts.packageManager === 'pnpm') {
      const yamlParse = await import('yaml').then(({ parse }) => parse);
      const wsfileStr = await fs.readFile(path.join(opts.cwd, 'pnpm-workspace.yaml'), 'utf8');
      const wsfile = yamlParse(wsfileStr);
      workspaces = wsfile.packages;
    }
    if (!workspaces || workspaces.length === 0) {
      console.log(
        'No workspaces found! Make sure you have \'workspaces\' field in your package.json or \'packages\' field in your pnpm-workspace.yaml',
      );
      return proc.exit(0);
    }

    if (opts.help) {
      cli.outputHelp();
      return;
    }

    pattern = pattern === '.' || pattern === '_' || pattern === '*' ? workspaces : pattern;

    const selected = await filter(workspaces, pattern, opts.cwd);

    if (opts.print) {
      if (opts.print === 'json') {
        console.log(JSON.stringify(selected));
        return;
      }
      if (opts.print === 'names') {
        console.log(Object.keys(selected).join('\n'));
        return;
      }
      if (opts.print === 'dirs') {
        console.log(
          Object.values(selected)
            // @ts-expect-error bruh, fvck off
            .reduce((acc, x) => acc.concat(x.dir), [])
            .join('\n'),
        );
      }
      return;
    }

    if (Object.keys(selected).length === 0) {
      console.log('No packages matching the filter.');
      proc.exit(0);
    } else {
      await runCommandOn(opts.isShell ? flagged : command.concat(flagged).flat(), selected, opts);
      // ? TODO: automatic handling of catalogs? Could be too expensive (slow),
      // ?       because after the install from `runCommandOn` we need to run one more to see what versions
      // ?       were installed for the given packages, and then extract them and return them from the `runCommandOn` or a hook/callback,
      // ?       and then write them to the default catalog in the rootPkgJson.
      // ? Or, we can just assume `latest` and fetch from here and put it in the catalog,
      // ?   but we still need to update the workspace's package.json to be `catalog:` for these packages.
      // ? It's too much.

      // if (opts.catalog && command[0] && command[0] === 'add') {
      //   const pkgsToInstall = command.slice(1);
      //   if (rootPkgJson.workspaces) {
      //     rootPkgJson.workspaces = rootPkgJson.workspaces || {};
      //   }
      //   if (rootPkgJson.workspace) {
      //     rootPkgJson.workspace = rootPkgJson.workspace || {};
      //     rootPkgJson.workspace.packages = rootPkgJson.workspace.packages || [];
      //     rootPkgJson.workspace.catalog = rootPkgJson.workspace.catalog || {};

      //   }
      // }
    }
  });

cli.help();
cli.parse();
