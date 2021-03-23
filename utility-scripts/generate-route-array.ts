#!/usr/bin/env -S npx ts-node
import fs from 'fs';
import path from "path";
import { recursiveListFilesInDirectory, listFilters } from "./file-helper";
import { parsePath } from './path-helper';

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
    return Object.values(HTTPMethod).includes(s as any);
}

export interface RouteObjectInterface {
    methods: HTTPMethod[],
    responseCodes: number[],
    requestSchemas: string[],
}

interface RouteDictionary {
    [key: string]: RouteObjectInterface;
}

(async () => {
    const result: RouteDictionary = {};
    const filePaths = await recursiveListFilesInDirectory(basePath, [], listFilters.endsWith(schemaExtension, true));
    filePaths.map(async absoluteFilePath => {
        const filePath = absoluteFilePath.substring(path.resolve(basePath).length);
        const {
            route,
            httpMethod,
            reqres,
            part
        } = parsePath(filePath);
        if (!isHTTPMethod(httpMethod)) {
            console.warn(`Route: ${route} has an unknown httpMethod: ${httpMethod}`)
            return;
        }

        result[route] = result[route] ?? {
            methods: [],
            responseCodes: [],
            requestSchemas: [],
        };

        if (reqres === 'request') {
            // this would be duplicated for each request schema which is why we have to block against it
            if(!result[route].methods.includes(httpMethod)) {
                result[route].methods.push(httpMethod);
            }
            
            result[route].requestSchemas.push(part);
        } else if (reqres === 'responses') {
            if(!result[route].methods.includes(httpMethod)) {
                result[route].methods.push(httpMethod);
            }

            const statusCode = parseInt(part, 10);
            result[route].responseCodes.push(statusCode);
        } else {
            console.error(`invalid reqres "${reqres}" for "${filePath}"`)
        }
    });

    await fs.promises.writeFile(destinationFile, JSON.stringify(result, null, 2));
})();