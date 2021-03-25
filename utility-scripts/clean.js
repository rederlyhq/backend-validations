// Not typescript
/* eslint-disable @typescript-eslint/no-var-requires */

const fse = require('fs-extra');

const { REDERLY_JUST_TEMP } = process.env;

const dirs = [
    'lib.tmp',
];

if (REDERLY_JUST_TEMP !== 'true') dirs.push('lib');

const promises = dirs.map(async (dir) => {
    const exists = await fse.pathExists(dir);
    if (exists) {
        await fse.remove(dir, {
            recursive: true
        });
    }
});

Promise.all(promises)
.then(() => console.log('Success'))
.catch(e => console.error('An error occurred', e));
