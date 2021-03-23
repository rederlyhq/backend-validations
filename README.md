# Backend Validation
A validation module for backend routes. Used as a glue between frontend and backend.

# Overview
This project is meant to be a middleware between the frontend and the backend. Using json schemas we are able to create validations as well as use them to create api documentation (using open api v3). most of the files inside the validations folder are auto generated (and thus git ignored).

# Key files
| File | Description |
| ---- | ----------- |
| src/validations/api.json | This is the base information used to generate OpenAPIV3 documentation which is sotred in **openapi.json** (alongside api.json) |
| src/validations/**${ROUTE}**/**${HTTP_METHOD}**/index.ts | This is an index file that aggregates relevant files for use (schemas and validated types) |
| src/validations/**${ROUTE}**/**${HTTP_METHOD}**/request/**${REQUEST_PART}**.schema.json** | JSON schema used for documentation and validation for a portion of a request (params, query, body) |
| src/validations/**${ROUTE}**/**${HTTP_METHOD}**/responses/**${STATUS_CODE}**.schema.json** | JSON schema used for documentation and validation for a response with the given status code |

# Working with the code base
After modifying schema files run `npm run generators`. This will generate all types and documentation.

# Considerations
* OpenAPI uses curly braces ({}) for denoting variables. In order to keep things simple I used it in the file paths. We could use a different character and translate however the curly braces haven't given me an issue and are an accideptable character so for now I'm leaving it.