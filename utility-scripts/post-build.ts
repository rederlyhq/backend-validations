#!/usr/bin/env -S npx ts-node
import fs from 'fs-extra';
import path from 'path';
import '../src/global-error-handlers';
import {listFilters, recursiveListFilesInDirectory} from './file-helper'

const destDir = path.resolve('lib.tmp');
const finalDestDir = path.resolve('lib');
const baseValidationsDir = path.resolve('src/validations');
const destValidationsDir = path.join(destDir, 'validations');

(async () => {
    const filesToCopy = await recursiveListFilesInDirectory(baseValidationsDir, [], listFilters.matches(/\.(?:json|d\.ts)$/));
    const promises = filesToCopy.map(async filePath => {
        const destPath = path.join(destValidationsDir, filePath.substring(baseValidationsDir.length));
        await fs.copy(filePath, destPath);
        console.log(destPath);
    });
    await Promise.all(promises);
    if (await fs.pathExists(finalDestDir)) {
        await fs.remove(finalDestDir);
    }
    await fs.move(destDir, finalDestDir);
})();