#!/usr/bin/env -S npx ts-node
import routesObject from '../src/validations/routes';
import _ from 'lodash';
import { RouteObjectInterface } from './generate-route-array';
import path from 'path';
import fs from 'fs';
import '../src/global-error-handlers';

const basePath = './src/validations/schemas';
const indexFiles: {
    path: string;
    operationId: string;
}[] = [];
(async () => {
    for(let route in routesObject) {
        const routeObject = routesObject[route as keyof typeof routesObject];
        const routeFilepath = path.join(basePath, route);
        for(let httpmethod in routeObject) {
            const methodObject = routeObject[httpmethod as keyof typeof routeObject] as RouteObjectInterface;

            const indexFilepath = path.join(routeFilepath, methodObject.isIndex ? '__index' : '', httpmethod, 'index.ts');
            console.log(`Writing index file: ${indexFilepath}`);
            indexFiles.push({
                path: indexFilepath,
                operationId: methodObject.operationId
            });
            await fs.promises.writeFile(indexFilepath, '/* This file was auto generated */\n');
            const requestPromises = methodObject.requestSchemas.map(async requestPart => {
                await fs.promises.appendFile(indexFilepath, `export {default as ${requestPart}Schema} from './request/${requestPart}.schema';\n`);
                await fs.promises.appendFile(indexFilepath, `export { I${_.upperFirst(requestPart)} } from './request/${requestPart}';\n`);
            });

            const responsePromises = methodObject.responseCodes.map(async statusCode => {
                await fs.promises.appendFile(indexFilepath, `export {default as status${statusCode}Schema} from './responses/${statusCode}.schema';\n`);
                await fs.promises.appendFile(indexFilepath, `export { I${statusCode} } from './responses/${statusCode}';\n`);
            })
            await Promise.all([...requestPromises, ...responsePromises]);
        }
    }

    const indexFilepath = './src/index.ts'
    console.log(`Writing index file: ${indexFilepath}`);
    await fs.promises.writeFile(indexFilepath, '/* This file was auto generated */\n');
    for (let indexFileObject of indexFiles) {
        let relativePath = path.relative(indexFilepath, indexFileObject.path);
        // for some reason relative thinks it is up a directory
        // also need to remove .ts extension
        relativePath = relativePath.substring(1, relativePath.length - 3);
        await fs.promises.appendFile(indexFilepath, `export * as ${indexFileObject.operationId} from '${relativePath}';\n`);
    }
})();
