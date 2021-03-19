#!/usr/bin/env -S npx ts-node
import fs from 'fs';
import path from "path";
import { OpenAPIV3 } from "openapi-types";
import _ from 'lodash';
import { generateDirectoryObject, listFilters, recursiveListFilesInDirectory } from './file-helper';
import baseOpenAPIObject from '../src/validations/api';

const pascalCase = (s: string): string => _.upperFirst(_.camelCase(s));

const parentDirectory = path.resolve(__dirname, '../src/validations');
const apiDocsPath = `${parentDirectory}/openapi.json`;
const routeDirectory = `${parentDirectory}/schemas`;
const schemaExtension = '.schema.json';

const tags: unknown[] = [];
const pathObject: OpenAPIV3.PathsObject = {};

const parsePath = (filePath: string) => {
    const tokens = filePath.split('/');
    const part = path.basename(tokens[tokens.length - 1], schemaExtension); // i.e. body, params, query
    const reqres = tokens[tokens.length - 2]; // request, response
    const httpMethod = tokens[tokens.length - 3]; // get, post
    const route = tokens.slice(0, tokens.length - 3).join('/');
    
    return {
        route: route,
        httpMethod: httpMethod,
        reqres: reqres,
        part: part
    } 
};

(async () => {
    const result = await generateDirectoryObject(routeDirectory);
    const filePaths = await recursiveListFilesInDirectory(parentDirectory, [], listFilters.endsWith(schemaExtension, true));
    const promises = filePaths.map(async absoluteFilepath => {
        const filepath = absoluteFilepath.substring(routeDirectory.length);
        const schemaResult = result.traverse(filepath);
        const tagResult = schemaResult.findClosest('tag.json');
        let tagObject = null;
        if (tagResult) {
            tagObject = require(tagResult.filePath);
            if (!tags.includes(tagObject)) {
                tagObject.name = tagObject.name ?? pascalCase(path.basename(tagResult.parent?.filePath ?? 'NULL-PARENT'));
                tags.push(tagObject);
            }
        }

        const parsedPath = parsePath(filepath);
        if (!pathObject[parsedPath.route]) {
            pathObject[parsedPath.route] = {};
        }
        if (pathObject[parsedPath.route]![parsedPath.httpMethod as 'get' | 'post']) {
            console.warn('Already exists and overwriting')
        }

        // For some reason relative path is going up one to many directories so substringing
        const relativePathToSchemaFromApiDoc = path.relative(apiDocsPath, schemaResult.filePath).substring(1);
        pathObject[parsedPath.route]![parsedPath.httpMethod as 'get' | 'post'] = {
            tags: tagObject?.name ? [tagObject.name] : undefined,
            requestBody: {
                // description: "NOT IMPLEMENTED",
                content: {
                    "application/json": {
                        schema: {
                            "$ref": relativePathToSchemaFromApiDoc
                        }
                    }
                }
            }
        }
    });
    await Promise.all(promises);
    baseOpenAPIObject.tags = tags as any;
    baseOpenAPIObject.paths = pathObject;
    await fs.promises.writeFile(apiDocsPath, JSON.stringify(baseOpenAPIObject, null, 2));
})();
