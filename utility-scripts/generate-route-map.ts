#!/usr/bin/env -S npx ts-node
import fs from 'fs';
import path from 'path';
import { recursiveListFilesInDirectory, listFilters, generateDirectoryObject } from './file-helper';
import { parsePath } from './path-helper';
import '../src/global-error-handlers';

import _ from 'lodash';
const pascalCase = (s: string): string => _.upperFirst(_.camelCase(s));

const schemaExtension = '.schema.json';
const validationsDir = path.resolve(__dirname, '../src/validations');
const basePath = `${validationsDir}/schemas`;
const destinationFile = `${validationsDir}/routes.json`;

enum HTTPMethod {
    GET='get',
    POST='post',
    PUT='put',
    DELETE='delete'
}

const isHTTPMethod = (s : string): s is HTTPMethod => {
    return Object.values(HTTPMethod).includes(s as HTTPMethod);
};

export interface RouteObjectInterface {
    method: HTTPMethod
    responseCodes: number[],
    requestSchemas: string[],
    isIndex: boolean;
    operationId: string;
}

interface RouteDictionary {
    [route: string]: {
        [method: string]: RouteObjectInterface
    };
}

(async () => {
    const result: RouteDictionary = {};
    const routeDirectoryObject = await generateDirectoryObject(basePath);
    const filePaths = await recursiveListFilesInDirectory(basePath, [], listFilters.endsWith(schemaExtension, true));
    filePaths.map(async absoluteFilePath => {
        const filePath = absoluteFilePath.substring(path.resolve(basePath).length);
        const fileDirectory = routeDirectoryObject.traverse(filePath);
        const tagDirectory = fileDirectory.findClosest('tag.json');
        let tagName: string | undefined;
        if (tagDirectory) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const tagObject = require(tagDirectory.filePath);
            tagName = tagObject.name ?? pascalCase(path.basename(tagDirectory.parent?.filePath ?? 'NULL-PARENT'));
        }

        const {
            route,
            httpMethod,
            reqres,
            part,
            isIndex,
            lastRouteToken,
        } = parsePath(filePath);
        if (!isHTTPMethod(httpMethod)) {
            console.warn(`Route: ${route} has an unknown httpMethod: ${httpMethod}`);
            return;
        }

        const operationId =  _.camelCase(`${tagName ?? 'untagged'}-${httpMethod}-${lastRouteToken}`);


        result[route] = result[route] ?? {};
        result[route][httpMethod] = result[route][httpMethod] ?? {
            method: httpMethod,
            responseCodes: [],
            requestSchemas: [],
            isIndex: isIndex,
            operationId
        };
        if (reqres === 'request') {
            result[route][httpMethod].requestSchemas.push(part);
        } else if (reqres === 'responses') {
            const statusCode = parseInt(part, 10);
            result[route][httpMethod].responseCodes.push(statusCode);
        } else {
            console.error(`invalid reqres "${reqres}" for "${filePath}"`);
        }
    });

    console.log(`Writing route dictionary: ${destinationFile}`);
    await fs.promises.writeFile(destinationFile, JSON.stringify(result, null, 2));
})();
