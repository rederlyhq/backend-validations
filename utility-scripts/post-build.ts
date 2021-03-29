#!/usr/bin/env -S npx ts-node
import fs from 'fs-extra';
import path from 'path';
import '../src/global-error-handlers';
import {listFilters, recursiveListFilesInDirectory} from './file-helper';
import crypto from 'crypto';

const destDir = path.resolve('lib');
const baseValidationsDir = path.resolve('src/validations');
const destValidationsDir = path.join(destDir, 'validations');

const hashFile = async(filePath: string): Promise<string> => {
    if(!await fs.pathExists(filePath)) {
        console.log('DNE ' + filePath);
        return '';
    }
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.pipe(hash);
    await new Promise<void>((resolve, reject) => {
        input.on('end', () => resolve());
        input.on('error', (err) => reject(err));
    });
    const result = hash.digest('hex');
    return result;
};

(async () => {
    const fileCandidatesToCopy = await recursiveListFilesInDirectory(baseValidationsDir, [], listFilters.matches(/\.(?:json|d\.ts)$/));
    const filesToCopy: string[] = [];
    let promises = fileCandidatesToCopy.map(async filePath => {
        const destPath = path.join(destValidationsDir, filePath.substring(baseValidationsDir.length));
        if (await hashFile(destPath) !== await hashFile(filePath)) {
            filesToCopy.push(filePath);
        }
    });
    await Promise.all(promises);

    promises = filesToCopy.map(async filePath => {
        const destPath = path.join(destValidationsDir, filePath.substring(baseValidationsDir.length));
        console.log(`Copying "${filePath}" ==> ${destPath}`);
        await fs.copy(filePath, destPath, {
            overwrite: true
        });
    });
    await Promise.all(promises);
})();
