#!/usr/bin/env -S npx ts-node
import routesObject from '../src/validations/routes';
import _ from 'lodash';
import { RouteObjectInterface } from './generate-route-array';
import path from 'path';
import fs from 'fs';

const basePath = './src/validations/schemas';

(async () => {
    for(let route in routesObject) {
        const routeObject = routesObject[route as keyof typeof routesObject] as RouteObjectInterface;
        const routeFilepath = path.join(basePath, route);

        const promises = routeObject.methods.map(async method => {
            const indexFilepath = path.join(routeFilepath, method, 'index.ts');
            console.log(`Writing ${indexFilepath}`);
                await fs.promises.writeFile(indexFilepath, '/* This file was auto generated */\n');
            const promises = routeObject.requestSchemas.map(async requestPart => {
                await fs.promises.appendFile(indexFilepath, `export {default as ${requestPart}Schema} from './request/${requestPart}.schema';\n`);
                await fs.promises.appendFile(indexFilepath, `export { I${_.upperFirst(requestPart)} } from './request/${requestPart}';\n`);
            });
            await Promise.all(promises);
        });
        await Promise.all(promises);
        
    
        console.log(routeFilepath);
    }
})();
