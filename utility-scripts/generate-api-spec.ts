#!/usr/bin/env -S npx ts-node
import fs from 'fs';
import path from 'path';
import { OpenAPIV3 } from 'openapi-types';
import _ from 'lodash';
import { generateDirectoryObject, listFilters, recursiveListFilesInDirectory } from './file-helper';
import importedOpenAPIObject from '../src/validations/api';
import { JSONSchema4 } from 'json-schema';
import { parsePath } from './path-helper';
import '../src/global-error-handlers';

const baseOpenAPIObject = importedOpenAPIObject as OpenAPIV3.Document;

const pascalCase = (s: string): string => _.upperFirst(_.camelCase(s));

const parentDirectory = path.resolve(__dirname, '../src/validations');
const apiDocsPath = `${parentDirectory}/openapi.json`;
const routeDirectory = `${parentDirectory}/schemas`;
const schemaExtension = '.schema.json';

const tags: unknown[] = [];
const pathObject: OpenAPIV3.PathsObject = {};

const useRefs = false;

(async () => {
    const result = await generateDirectoryObject(routeDirectory);
    const filePaths = await recursiveListFilesInDirectory(routeDirectory, [], listFilters.endsWith(schemaExtension, true));
    const promises = filePaths.map(async absoluteFilepath => {
        const filepath = absoluteFilepath.substring(routeDirectory.length);
        const schemaResult = result.traverse(filepath);

        const parsedPath = parsePath(filepath);

        const routeObject = pathObject[parsedPath.route] ?? {};
        pathObject[parsedPath.route] = routeObject;

        let currentObject = routeObject[parsedPath.httpMethod as 'get' | 'post'];
        
        if (!currentObject) {
            const tagResult = schemaResult.findClosest('tag.json');
            let tagObject = null;
            if (tagResult) {
                tagObject = require(tagResult.filePath);
                if (!tags.includes(tagObject)) {
                    tagObject.name = tagObject.name ?? pascalCase(path.basename(tagResult.parent?.filePath ?? 'NULL-PARENT'));
                    tags.push(tagObject);
                }
            }

            const operationId =  _.camelCase(`${tagObject.name}-${parsedPath.httpMethod}-${parsedPath.lastRouteToken}`);

            currentObject = {
                tags: tagObject?.name ? [tagObject.name] : undefined,
                operationId: operationId
            };
            routeObject[parsedPath.httpMethod as 'get' | 'post'] = currentObject;
        }

        const filename = path.basename(schemaResult.filePath, schemaExtension);
        if (parsedPath.reqres === 'request') {
            switch (filename) {
                case 'body':
                    const schemaValue = useRefs ? {'$ref': path.relative(apiDocsPath, schemaResult.filePath).substring(1)} : require(schemaResult.filePath);
                    currentObject.requestBody = {
                        // description: "NOT IMPLEMENTED",
                        content: {
                            'application/json': {
                                schema: schemaValue
                            }
                        }
                    };
                    break;
                case 'params':
                case 'query':
                    /**
                     * params and query don't support json schemas
                     * openapi puts query params and path params in the same spot (having an array of objects with a property that dictates which is which)
                     * in order to keep the validation consistently this translates the object to an openapi param
                     */
    
                    // There might be mroe to do here
                    // https://swagger.io/docs/specification/serialization/
                    const isPath = filename === 'params';
                    // This is a dynamic import for reading the file
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const schema = require(schemaResult.filePath) as JSONSchema4;
                    const currentParameters = currentObject.parameters ?? [];
                    currentObject.parameters = currentParameters;
                    Object.entries(schema.properties ?? {}).forEach((entry) => {
                        const required = Array.isArray(schema.required) && schema.required.includes(entry[0]);
                        if (isPath && !required) {
                            console.warn(`OpenAPI does not like optional path parameters but "${entry[0]}" is optional for "${parsedPath.route}"`);
                        }
                        currentParameters.push({
                            in: isPath ? 'path' : 'query',
                            name: entry[0],
                            schema: entry[1] as OpenAPIV3.SchemaObject,
                            required: required
                        });
                    });
                    break;
                default:
                    console.warn(`Invalid filename ${filename}`);
            }
        } else if (parsedPath.reqres === 'responses') {
            const schemaValue = useRefs ? {
                // For some reason relative path is going up one to many directories so substringing
                $ref: path.relative(apiDocsPath, schemaResult.filePath).substring(1)
            } : require(schemaResult.filePath);
            currentObject.responses = currentObject.responses ?? {};
            currentObject.responses[filename] = {
                content: {
                    'application/json': {
                        schema: schemaValue
                    }
                },
                // This is a dynmaic import for reading the file
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                description: (require(schemaResult.filePath) as JSONSchema4).description ?? 'No description set'
            };
        } else {
            throw new Error(`${parsedPath.reqres} is not request or responses, this was already checked and still failed`);
        }

    });
    await Promise.all(promises);
    baseOpenAPIObject.tags = tags as OpenAPIV3.TagObject[];
    baseOpenAPIObject.paths = pathObject;
    console.log(`Writing api docs: ${apiDocsPath}`);
    await fs.promises.writeFile(apiDocsPath, JSON.stringify(baseOpenAPIObject, null, 2));
})();
