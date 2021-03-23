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


// export interface RederlyExpressRequest<Params = unknown, Body = unknown, Query = unknown> extends Request<core.ParamsDictionary, any, any, core.Query> {
//     rederlyReq?: {
//         params: Params;
//         body: Body;
//         query: Query;
//     }
// }

app.use(bodyParser.json());

app.post('/test/:motmot/:second',
    validationMiddleware({
        bodySchema: tom.bodySchema,
        paramsSchema: tom.paramsSchema,
        querySchema: tom.querySchema,
    }),
    // (req: Request<tom.Params, unknown, tom.Body, any>, res: Response, next: NextFunction) => {
    (req: Request, res: Response, next: NextFunction) => {
        const params = req.params as unknown as tom.IParams;
        const query = req.query as unknown as tom.IQuery;
        const body = req.body as tom.IBody;
        // // const query = req.query as tom.Query;
        // const params = req.params as tom.Params;
        // const motmot = req.params.motmot;
        // const second = req.params.second;
        // req.params.tom
        // const tomtom = req.body.tomtom;
        // const a1231253 = query[1231253];

        // const abcdbc = query.abcdbc;
        console.log(params);
        console.log(query);
        console.log(body);
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
