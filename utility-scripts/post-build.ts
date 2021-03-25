#!/usr/bin/env -S npx ts-node
import fs from 'fs-extra';
import path from 'path';
import '../src/global-error-handlers';
import {listFilters, recursiveListFilesInDirectory} from './file-helper'

const baseDir = path.resolve('src/validations');
const destDir = path.resolve('lib/validations');

const extension = '.json';
(async () => {
    const filesToCopy = await recursiveListFilesInDirectory(baseDir, [], listFilters.matches(/\.(?:json|d\.ts)$/));
    filesToCopy.map(async filePath => {
        const destPath = path.join(destDir, filePath.substring(baseDir.length));
        await fs.copy(filePath, destPath);
        console.log(destPath);
    });
})();