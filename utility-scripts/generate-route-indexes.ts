#!/usr/bin/env -S npx ts-node
import routesObject from '../src/validations/routes';
import _ from 'lodash';
import { RouteObjectInterface } from './generate-route-array';
import path from 'path';
import fs from 'fs';

const basePath = './src/validations/schemas';

(async () => {
    for(let route in routesObject) {
        const routeObject = routesObject[route as keyof typeof routesObject];
        const routeFilepath = path.join(basePath, route);
        for(let httpmethod in routeObject) {
            const methodObject = routeObject[httpmethod as keyof typeof routeObject] as RouteObjectInterface;
            const indexFilepath = path.join(routeFilepath, httpmethod, 'index.ts');
            console.log(`Writing ${indexFilepath}`);
            await fs.promises.writeFile(indexFilepath, '/* This file was auto generated */\n');
            const promises = methodObject.requestSchemas.map(async requestPart => {
                await fs.promises.appendFile(indexFilepath, `export {default as ${requestPart}Schema} from './request/${requestPart}.schema';\n`);
                await fs.promises.appendFile(indexFilepath, `export { I${_.upperFirst(requestPart)} } from './request/${requestPart}';\n`);
            });
            await Promise.all(promises);
        }
    }
})();
