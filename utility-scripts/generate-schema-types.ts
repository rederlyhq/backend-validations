#!/usr/bin/env -S npx ts-node
import JsonToTS from 'json-to-ts';
import { listFilters, recursiveListFilesInDirectory } from './file-helper';
import path from 'path';
import fs from 'fs';
import '../src/global-error-handlers';

const extension = '.json';

const generateJSONDTS = (extension: string) => async (filePath: string) => {
    const dirname = path.dirname(filePath);
    const filename = path.basename(filePath, extension);
    const newPath = path.join(dirname, `${filename}${path.basename(extension, '.json')}.d.ts`);
    const tsInterfaces = JsonToTS(require(filePath));

    console.log(`Writing type file for json: ${newPath}`);
    await fs.promises.writeFile(newPath, `
/* tslint:disable */
/**
* This file was automatically generated by json-to-ts.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run generate-schema-types.ts to regenerate this file.
*/
`);
    // needs to be sequential
    for (let i = 0; i < tsInterfaces.length; i++) {
        // await fs.promises.appendFile(newPath, 'export ');
        await fs.promises.appendFile(newPath, tsInterfaces[i]);
        await fs.promises.appendFile(newPath, '\n\n');
    }
    await fs.promises.appendFile(newPath, 'declare const _default: RootObject;\nexport default _default;');
}
(async () => {
    const filePaths = await recursiveListFilesInDirectory('./src/validations', [], listFilters.endsWith(extension, true));
    // const promises = filePaths.map(generateJSONDTS(schemaExtension));
    // const promise = generateJSONDTS('.json')(path.resolve('./src/jsonschema/validations/routes.json'));
    const promises = filePaths.map(generateJSONDTS(extension));

    await Promise.all(promises);
})();