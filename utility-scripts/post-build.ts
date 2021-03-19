#!/usr/bin/env -S npx ts-node
import fs from 'fs-extra';
import path from 'path';
const builtDirectory = 'lib';

const filesToCopy = [
    'src/validations',
];

(async () => {
    const copyFilePromises = filesToCopy.map(async fileToCopy => {
        const dest = `${builtDirectory}/${path.basename(fileToCopy)}`;
        console.log(`Copying ${fileToCopy} ==> "${dest}"`);
        await fs.copy(fileToCopy, dest, {recursive: true});
        console.log(`Finished copying ${fileToCopy} ==> "${dest}"`);
    });
    await Promise.all(copyFilePromises);
})();