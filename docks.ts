// A 2025 temporary `docks` script to generate markdown docs from JSDoc comments
// see the very end of this file for usage example, basically `writer(docks())`

import fs from 'node:fs';
import path from 'node:path';
import proc from 'node:process';
import Comments from 'parse-comments';

const parser = new Comments();

export type DocksOptions = {
  pkgRoot: string;
  promo: boolean;
  flat: boolean;
  verbose: boolean;
  force: boolean;
  fileHeading: boolean;
  outfile: string;
  outFile: string;
};

export const docksDefaultOptions = {
  promo: true,
  flat: true,
  verbose: true,
  force: true,
  fileHeading: false,
  outfile: 'README.md',
  outFile: 'README.md',
};

export function docks(filepath: string = 'src/index.ts', options?: Partial<DocksOptions>) {
  const opts = { ...docksDefaultOptions, pkgRoot: proc.cwd(), ...options };
  opts.outfile = opts.outfile || opts.outFile;
  opts.fileHeading = opts.flat !== true;

  const relativePath = path.relative(opts.pkgRoot, filepath);
  const heading = opts.fileHeading ? '#' : '';

  const fileContent = fs.readFileSync(filepath, 'utf8');

  const comments = parser.parse(fileContent);
  const contents = comments
    .filter((cmt) =>
      cmt.tags.find((x) => (x.title === 'api' && x.name === 'public') || x.title === 'public'),
    )
    .reduce((acc, comment) => {
      const locUrl = `${relativePath}#L${comment.code.loc.start.line}`;

      const tagName = comment.tags.find((tag) => tag.title === 'name');
      const tags = tagName ? comment.tags.filter((x) => x.title !== 'name') : comment.tags;

      const name =
        (tagName && tagName.name) ||
        comment.code.context?.name ||
        comment.code.value.match(/(\w+)\($/)?.[1] ||
        '____unknown__';

      if (name === '____unknown__') {
        throw new Error(`Unknown function name in ${filepath} at line: ${comment.code.value}`);
      }

      const clearName = name.replace(/^\./, '').toLowerCase();
      const paramsId = `<span id="${clearName}-params"></span>\n\n`;
      const signatureId = `<span id="${clearName}-signature"></span>\n\n`;
      const examplesId = `<span id="${clearName}-examples"></span>\n\n`;
      const throwsId = `<span id="${clearName}-throws"></span>\n\n`;
      const returnsId = `<span id="${clearName}-returns"></span>\n\n`;

      // ?NOTE: if the function params are multiline, then we don't have access to all of them,
      // ? so we won't have a "Signature" section. It's bug in the `parse-comments` but not that important.
      const index = comment.code.value.indexOf('(');
      const signature = comment.code.value.slice(index, -1).trim();
      const signatureBlock =
        signature.length > 0
          ? `${signatureId}####${heading} Signature\n\n\`\`\`ts\nfunction${signature}\n\`\`\`\n`
          : '';

      const mapper = (tag) => {
        const descr = tag.description.replace(/-\s+/, '');
        const description = descr.length > 0 ? ` - ${descr}` : '';
        const tagType = getParamType(tag);

        const name = tag.name && tag.name.length > 0 ? `\`${tag.name}\`` : '';

        return `- ${name}${name.length === 0 ? tagType.trim() : tagType}${description}`;
      };

      const paramsStr = tags
        .filter((tag) => !/api|public|private|returns?|throws?/.test(tag.title))
        .map(mapper)
        .join('\n');

      const paramsBlock =
        paramsStr.length > 0 ? `\n${paramsId}####${heading} Params\n\n${paramsStr}` : '';

      const throwsStr = tags
        .filter((tag) => /throws?/.test(tag.title))
        .map(mapper)
        .join('\n');

      const throwsBlock =
        throwsStr.length > 0 ? `\n${throwsId}####${heading} Throws\n\n${throwsStr}\n` : '';

      const returnsStr = tags
        .filter((tag) => /returns?/.test(tag.title))
        .map(mapper)
        .join('\n');

      const returnsBlock =
        returnsStr.length > 0 ? `\n${returnsId}####${heading} Returns\n\n${returnsStr.trim()}` : '';

      const hasJavadoc =
        comment.examples[0]?.type === 'javadoc' && comment.examples[0]?.value.trim() === '';

      // ? NOTE: this is in case there is both `@example` and a codeblock with language after it.
      // ? NOTE: if there's only `@example` and no codeblock, then we don't need to slice it.
      // ? NOTE: if there's only a codeblock with language, then we don't need to slice it either.
      if (hasJavadoc && comment.examples.length > 0) {
        comment.examples = comment.examples.slice(1);
      }

      const examples = comment.examples
        .map(
          (example) =>
            `${example.description.trim()}\n\n${examplesId}####${heading} Examples\n\n\`\`\`${
              example.language || 'ts'
            }${example.value}\`\`\``,
        )
        .join('\n');

      const str = `###${heading} [${name}](./${locUrl})\n\n${
        comment.description
      }\n\n${signatureBlock}${paramsBlock}\n${throwsBlock}${returnsBlock}${examples}`;

      return `${acc}\n\n${str}`;
    }, '');

  return {
    options: opts,
    filepath,
    contents,
  };
}

function getParamType(tag: any) {
  let paramType = '';

  if (tag?.type?.type === 'NameExpression') {
    paramType = tag.type.name;
  }
  if (tag?.type?.type === 'UnionType') {
    paramType = tag.type.elements.map((x) => x.name).join('|');
  }

  // currently only works for basic cases like `Array<string>` and `string[]`
  // which is completely okay for most cases
  if (tag?.type?.type === 'TypeApplication') {
    paramType = tag.type.expression.name;
    paramType += '&lt;';
    paramType += tag.type.applications[0].name;
    paramType += '&gt;';
  }

  return paramType.length > 0 ? ` **{${paramType}}**` : '';
}

async function writer(filepath: string, contents: string, options: DocksOptions) {
  const relPath = path.relative(options.pkgRoot, filepath);
  // const oldBasename = path.basename(relPath, path.extname(relPath));
  // const mdBasename = `${oldBasename}.md`;
  // const relDocsPath = path.join('docs', path.dirname(relPath), mdBasename);
  // const outputFile = path.join(options.pkgRoot, relDocsPath);

  const promo = options.promo
    ? `_Generated using [docks](https://github.com/tunnckoCore/workspaces-filter/blob/master/docks.ts)._`
    : '';

  const header = options.fileHeading ? `\n\n### ${relPath}` : '';
  const docksStart = '<!-- docks-start -->';
  const docksEnd = '<!-- docks-end -->';
  const docsContents =
    contents.length > 0 ? `${header}\n\n${promo}\n\n${contents.trim()}\n\n` : '\n';

  const outFilePath = path.join(options.pkgRoot, options.outfile);
  const outFileContents = fs.readFileSync(outFilePath, 'utf8');

  if (outFileContents.includes(docksStart) && outFileContents.includes(docksEnd)) {
    const idxStart = outFileContents.indexOf(docksStart) + docksStart.length;
    const idxEnd = outFileContents.indexOf(docksEnd);
    // const oldApiContents = outFileContents.slice(idxStart, idxEnd).trim();
    // const newContents = `\n${docsContents}\n`;

    const beforeDocks = outFileContents.slice(0, idxStart);
    const afterDocks = outFileContents.slice(idxEnd);
    const newContent = `${beforeDocks}${docsContents}${afterDocks}`;
    fs.writeFileSync(outFilePath, newContent);

    // if (!oldApiContents.includes(newContents.trim())) {
    //   const beforeApi = outFileContents.slice(0, idxStart);
    //   const api = `\n\n${oldApiContents}${newContents}\n`;
    //   const afterApi = outFileContents.slice(idxEnd);

    //   await fs.writeFile(pkgVerbMd, `${beforeApi}${api}${afterApi}`);
    // }
  }

  // const outDir = path.dirname(outputFile);
  // await fsp.mkdir(outDir, { recursive: true });
  // await fsp.writeFile(outputFile, cont);
}

/**
 * USAGE EXAMPLE
 */

const result = docks();

await writer(result.filepath, result.contents, result.options);
