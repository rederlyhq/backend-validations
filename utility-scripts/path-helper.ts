import path from 'path';

const schemaExtension = '.schema.json';

export const parsePath = (filePath: string) => {
    const tokens = filePath.split('/');
    const part = path.basename(tokens[tokens.length - 1], schemaExtension); // i.e. body, params, query, 200, 404
    const reqres = tokens[tokens.length - 2]; // request, response
    const httpMethod = tokens[tokens.length - 3]; // get, post
    let route = tokens.slice(0, tokens.length - 3).join('/');
    const indexFilename = '/__index';
    if (route.endsWith(indexFilename)) {
        route = route.substring(0, route.length - indexFilename.length);
    } 

    const validReqRes = ['request', 'responses'];
    if (!validReqRes.includes(reqres)) {
        throw new Error(`${filePath} does not follow the pardigm... Expected ${reqres} to be ${validReqRes}`);
    }
    return {
        route: route,
        httpMethod: httpMethod,
        reqres: reqres as 'request' | 'responses',
        part: part
    } 
};