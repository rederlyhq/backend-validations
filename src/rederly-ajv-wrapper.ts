import Ajv, { AnySchemaObject } from "ajv"
import { DataValidateFunction, DataValidationCxt, Schema, ValidateFunction } from "ajv/dist/types";
import addFormats from "ajv-formats"
import _ from 'lodash';
import functions from '@rederly/rederly-utils/lib/generics/lodash-mixins';

const TSTypeConversion = {
    Date: (value: any): Date => {
        const date: Date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error(`Could not parse date [${value}]`);
        }
        return date;
    },
    unknown: (value: unknown): unknown => value
}

interface AddErrorToValidateFuncOptions {
    validateFunc: DataValidateFunction;
    errMessage: string;
}

const addErrorToValidateFunc = ({validateFunc, errMessage}: AddErrorToValidateFuncOptions) => {
    validateFunc.errors = [...(validateFunc.errors ?? []), {
        message: errMessage
        // Couldn't find a reference to this, however schemaPath which is injected ends in /tsType
        // keyword: 'tsType', 
        // Don't know how to set, on intentional errors this is empty object
        // params: {},
        // This is injected by ajv
        // dataPath: dataPath,
        // This is injected by ajv
        // schemaPath: 'TODO',
}];

}
const boolValidateFunc = (val: boolean, error?: string): DataValidateFunction => function validateFunction() {
    if (error !== undefined) {
        addErrorToValidateFunc({
            validateFunc: validateFunction as DataValidateFunction,
            errMessage: error
        });
    }
    return val;
};

// in index.d.ts ValidateFunction is defined to have this of Ajv | any
// schema is string since this is attached to strings
function tsTypeKeywordCompileFunc (this: Ajv, schema: string, parentSchema: AnySchemaObject): DataValidateFunction {
    const coerceTypes = Boolean(this?.opts?.coerceTypes);
    if (!coerceTypes) {
        return boolValidateFunc(true);
    }

    if (!(schema in TSTypeConversion)) {
        return boolValidateFunc(false, `Rederly AJV: specified schema [${schema}] cannot be coerced to TSType`);
    }

    const validateFunction: DataValidateFunction = function (
        // data can be any but we specified that that this function is on type string
        data?: string,
        info?: DataValidationCxt
    ): boolean {
        if (!info) {
            addErrorToValidateFunc({
                validateFunc: validateFunction,
                errMessage: 'Rederly AJV: info was not provided to validate function'
            });
            return false
        };
        const { parentData, parentDataProperty } = info;
        if (schema in TSTypeConversion) {
            try {
                const date = TSTypeConversion[schema as keyof typeof TSTypeConversion](data);
                if (parentData) {
                    parentData[parentDataProperty] = date;
                } else {
                    // TODO
                    console.log('has no parent');
                }
                return true;
            } catch(e) {
                addErrorToValidateFunc({
                    validateFunc: validateFunction,
                    errMessage: e.message
                });
                return false;
            }
        } else {
            // This should not happen: already checked above for optimization
            addErrorToValidateFunc({
                validateFunc: validateFunction,
                errMessage: `Rederly AJV: specified schema [${schema}] cannot be coerced to TSType`
            });
            return false;
        }
    };
    return validateFunction;
};

export const ajv = new Ajv({
    strict: true,
    coerceTypes: true,
    useDefaults: true,
    removeAdditional: 'all',
});

addFormats(ajv)

// This is a keyword for openapi
ajv.addKeyword('example');

ajv.addKeyword({
    compile: tsTypeKeywordCompileFunc,
    // type: 'string',
    // modifying: true,
    // errors: true,
    keyword: 'tsType',
    modifying: true,
    errors: true
});

export default ajv;
export { Schema as AJVSchema };
interface ValidateOptions<InputType = unknown> {
    schema: Schema;
    data: InputType;
    clone: boolean;
};

export class RederlyValidationError<T = unknown> extends Error {
    static readonly ERROR_NAME = 'RederlyValidationError';
    public readonly validate: ValidateFunction<T>;
    public readonly name: string;

    constructor(validate: ValidateFunction<T>) {
        super(JSON.stringify(validate.errors));
        this.validate = validate;
        this.name = RederlyValidationError.ERROR_NAME;
    }

    static isRederlyValidationError(err: Error): err is RederlyValidationError {
        return err.name === RederlyValidationError.ERROR_NAME;
    }
}
export const validate = <ValidatedType, InputType = unknown>({
    schema,
    data,
    clone = false
}: ValidateOptions<InputType>): ValidatedType => {
    const result =  clone ? _.cloneDeep(data) : data;
    const validate = ajv.compile<ValidatedType>(schema);
    if (validate(result)) {
        // Instead of just returning the result maybe we could return an object
        // Input object ref
        // Modified object ref
        // Unmodified object ref
        // The idea there is that you could modify in place but keep the original for some sort of comparison
        // i.e. I want to check additional keys but validating a request I want to use the initial object references
        return result;
    } else {
        throw new RederlyValidationError(validate);
    }
}

interface ValidateAndCheckForAdditionalKeysOptions<InputType = unknown> {
    schema: Schema;
    data: InputType;
}

interface ValidateAndCheckForAdditionalKeysResult<ValidatedType = unknown> {
    additionalKeys: string[];
    result: ValidatedType;
}

/**
 * This function mutates data to be the validated type
 * @param schema 
 * @param data 
 * @returns 
 */
export const validateAndCheckForAdditionalKeys = <ValidatedType = unknown, InputType = ValidatedType>({schema, data}: ValidateAndCheckForAdditionalKeysOptions<InputType>): ValidateAndCheckForAdditionalKeysResult<ValidatedType> => {
    const original = _.cloneDeep(data);
    const result = validate<ValidatedType>({
        schema: schema,
        data: data,
        clone: false
    });

    const inputKeys = functions.removeArrayIndexesFromDeepKeys(functions.deepKeys(data));
    const resultKeys = functions.removeArrayIndexesFromDeepKeys(functions.deepKeys(original));
    const additionalKeys = _.difference(resultKeys, inputKeys);
    return {
        result,
        additionalKeys
    };
}