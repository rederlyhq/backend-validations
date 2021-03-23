#!/usr/bin/env -S npx ts-node
import { recursiveListFilesInDirectory, listFilters } from './file-helper';
import { RederlyValidationError, validate } from '../src/rederly-ajv-wrapper';
import '../src/global-error-handlers';

const schemaExtension = '.schema.json';
(async () => {
    const filePaths = await recursiveListFilesInDirectory('./src/validations/schemas', [], listFilters.endsWith(schemaExtension, true));
    for (const filePath of filePaths) {
        try {
            console.log(`Validating ${filePath}`);
            validate({
                schema: require(filePath),
                data: {},
                clone: false
            });
        } catch (validatingError) {
            if (!RederlyValidationError.isRederlyValidationError(validatingError)) {
                console.error(`${filePath} failed validation test`, validatingError);
                throw validatingError;
            }
        }
    };
})();