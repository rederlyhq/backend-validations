#!/usr/bin/env -S npx ts-node
import fs from 'fs';
import path from "path";
import { recursiveListFilesInDirectory, listFilters } from "./file-helper";

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

interface RouteDictionary {
    [key: string]: {
        methods: HTTPMethod[]
    }
}

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
    const result: RouteDictionary = {};
    const filePaths = await recursiveListFilesInDirectory(basePath, [], listFilters.endsWith(schemaExtension, true));
    filePaths.map(async absoluteFilePath => {
        const filePath = absoluteFilePath.substring(path.resolve(basePath).length);
        const {
            route,
            httpMethod
        } = parsePath(filePath);
        if (!isHTTPMethod(httpMethod)) {
            console.warn(`Route: ${route} has an unknown httpMethod: ${httpMethod}`)
            return;
        }

        result[route] = result[route] ?? {
            methods: []
        };
        result[route].methods.push(httpMethod);
    });

    fs.promises.writeFile(destinationFile, JSON.stringify(result, null, 2));
})();