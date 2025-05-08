import dox from 'dox';
import fs from 'node:fs';

const fileStr = fs.readFileSync('./src/index.ts', 'utf8');
const obj = dox.parseComments(fileStr).filter((x) => x.tags.length > 0);

console.log(JSON.stringify(obj, null, 2));

// console.log(obj[0].tags[0].html);
