const path = require('path');
require('ts-node').register({
    dir: process.cwd(),
    project: path.join(process.cwd(), 'tsconfig.json')
});
require('./index.ts');
