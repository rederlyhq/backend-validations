import { Schema } from 'ajv';
import Boom from 'boom';
import { Request, Response, NextFunction } from 'express';
import { RederlyValidationError, validate } from './rederly-ajv-wrapper';
import _ from 'lodash';

interface ValidationMiddlewareOptions {
    bodySchema?: Schema | null,
    querySchema?: Schema | null,
    paramsSchema?: Schema | null,
}

export const validationMiddleware = ({ bodySchema, querySchema, paramsSchema }: ValidationMiddlewareOptions) => (req: Request, res: Response, next: NextFunction) => {
    const validationObject = {
        body: bodySchema,
        query: querySchema,
        params: paramsSchema
    }

    let success = true;
    Object.entries(validationObject).some((entry) => {
        const [key, schema] = entry;
        const toValidate = req[key as 'query' | 'body' | 'params'];
        if (schema) {
            try {
                validate({
                    schema: schema,
                    data: toValidate,
                    clone: false
                });
                // don't return so it will continue to test (could return false)
            } catch (e) {
                if (RederlyValidationError.isRederlyValidationError(e)) {
                    next(Boom.badRequest('Backend validation failed for ', {
                        key: key,
                        errors: e.validate.errors
                    }));
                } else {
                    const message = `Error validating "${key}"`;
                    console.error(message, e.message)
                    next(Boom.badRequest('Error validating', message));
                }
                // in either case it failed and no reason to go on
                success = false;
                return true;
            }
        } else if (!_.isEmpty(toValidate)) {
            next(Boom.badRequest(`Request "${key}" is not allowed for this request`));
            success = false;
            return true;
        }
        // at this point it succeeded validation
        // or there was no data to validate and no schema to validate it
    });

    if (success) {
        next();
    }
}
