#!/usr/bin/env -S npx ts-node

import { absolutePath } from "swagger-ui-dist";
import express from 'express';
import path from 'path';

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

app.listen(3000, () => {
    console.log('started')
});
