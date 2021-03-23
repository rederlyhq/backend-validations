#!/usr/bin/env -S npx ts-node

import { absolutePath } from "swagger-ui-dist";
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { validationMiddleware } from "./validation-middleware";
import * as tom from './validations/schemas/test/{motmot}/{second}/post';

import * as core from 'express-serve-static-core';
import Boom from "boom";
import bodyParser from 'body-parser';

const app = express();

// const ui = SwaggerUIStandalonePreset({
//     url: "https://petstore.swagger.io/v2/swagger.json",
//     dom_id: '#swagger-ui',
//     presets: [
//         // SwaggerUIBundle.presets.apis,
//         // SwaggerUIBundle.SwaggerUIStandalonePreset
//     ],
//     layout: "StandaloneLayout"
// });

const swaggerPath = absolutePath();
console.log(swaggerPath);
// console.log(Object.keys(test));
app.use('/swagger', express.static(swaggerPath));
const validationDirectory = path.resolve(__dirname, './validations');
console.log(validationDirectory);
app.use('/json', express.static(path.resolve(__dirname, validationDirectory)));

// declare global {
//     namespace Express {
//         export interface ParamsDictionary {
//             [key: string]: any;
//         }
//     }
// }


export interface RederlyExpressRequest<Params = unknown, Query = unknown, Body = unknown> extends Request<core.ParamsDictionary, any, any, core.Query> {
    rederlyReq?: {
        params: Params;
        body: Body;
        query: Query;
    }
}

app.use(bodyParser.json());

const declareType = <T>(v: any): v is T => {
    return true;
}

interface RederlyExpressRequestOverride <ParamsType,QueryType,BodyType> {
    params: ParamsType,
    query: QueryType,
    body: BodyType
}

app.post('/test/:motmot/:second',
    validationMiddleware(tom),
    // (req: Request<tom.Params, unknown, tom.Body, any>, res: Response, next: NextFunction) => {
    (req: RederlyExpressRequest, res: Response, next: NextFunction) => {
        if(!declareType<RederlyExpressRequestOverride<tom.IParams, tom.IQuery, tom.IBody>>(req)) return;
        const a = req as RederlyExpressRequestOverride<tom.IParams, tom.IQuery, tom.IBody>;
        console.log(a.params);
        console.log(a.query);
        console.log(req.body);
        res.send('success');
    }
)

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const boomError = Boom.isBoom(err) ? err : Boom.internal(err?.message ?? err ?? 'NULL ERROR');
    res.status(boomError.output.statusCode).send({
        ...boomError.output.payload,
        data: boomError.data
    });
})
app.listen(3000, () => {
    console.log('started')
});
