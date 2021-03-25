import path from 'path';
import _ from 'lodash';

const schemaExtension = '.schema.json';

export const parsePath = (filePath: string) => {
    const tokens = filePath.split('/');
    const part = path.basename(tokens[tokens.length - 1], schemaExtension); // i.e. body, params, query, 200, 404
    const reqres = tokens[tokens.length - 2]; // request, response
    const httpMethod = tokens[tokens.length - 3]; // get, post
    // maybe this should be tag name
    const firstRouteToken = tokens[0] || tokens[1];
    let route = tokens.slice(0, tokens.length - 3).join('/');
    const indexFilename = '/__index';
    let isIndex = false;
    if (route.endsWith(indexFilename)) {
        route = route.substring(0, route.length - indexFilename.length);
        isIndex = true;
    } 

    const lastRouteTokenIndex = tokens.length - (isIndex ? 5: 4);
    let lastRouteToken = tokens[lastRouteTokenIndex];
    if ((/^\{.+\}$/.test(lastRouteToken))) {
        lastRouteToken = `${tokens[lastRouteTokenIndex-1]}-by-${lastRouteToken}`
    }
    console.log(`${firstRouteToken}-${httpMethod}-${lastRouteToken}`);
    const operationId = _.camelCase(`${firstRouteToken}-${httpMethod}-${lastRouteToken}`);

    const validReqRes = ['request', 'responses'];
    if (!validReqRes.includes(reqres)) {
        throw new Error(`${filePath} does not follow the pardigm... Expected ${reqres} to be ${validReqRes}`);
    }

    return {
        route: route,
        httpMethod: httpMethod,
        reqres: reqres as 'request' | 'responses',
        part: part,
        isIndex: isIndex,
        operationId: operationId
    } 
};