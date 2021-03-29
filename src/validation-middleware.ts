import { Schema } from 'ajv';
import { RederlyValidationError, validate } from './rederly-ajv-wrapper';
import _ from 'lodash';

interface Request {
    query: unknown;
    body: unknown;
    params: unknown;
}

interface Response {

}

interface NextFunction {
    (arg?: unknown): void
}


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
        const typedKey = key as 'query' | 'body' | 'params';
        const toValidate = req[typedKey];
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
                    console.log(e.validate.errors);
                    const firstError = e.validate.errors?.[0];
                    next({
                        message: `Backend validation failed for "${firstError?.dataPath}" ${firstError?.message ?? 'unknown'}`,
                        date: {
                            key: key,
                            errors: e.validate.errors
                        }
                    });
                } else {
                    const message = `Error validating "${key}"`;
                    console.error(message, e.message);
                    next({
                        message: 'Error validating',
                        date: {
                            error: message
                        }
                    });
                }
                // in either case it failed and no reason to go on
                success = false;
                return true;
            }
        } else if (!_.isEmpty(toValidate)) {
            next({
                message: `Request "${key}" is not allowed for this request`,
            });

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
