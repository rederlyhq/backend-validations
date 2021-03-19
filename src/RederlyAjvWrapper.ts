import Ajv, { AnySchemaObject } from "ajv"
import { DataValidateFunction, DataValidationCxt, Schema } from "ajv/dist/types";
import addFormats from "ajv-formats"
import _ from 'lodash';

const TSTypeConversion = {
    Date: (value: any): Date => {
        const date: Date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error(`Could not parse date [${value}]`);
        }
        return date;
    } 
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
                parentData[parentDataProperty] = date;
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

const ajv = new Ajv({
    coerceTypes: true,
});

addFormats(ajv)

ajv.addKeyword({
    compile: tsTypeKeywordCompileFunc,
    // type: 'string',
    // modifying: true,
    // errors: true,
    keyword: 'tsType',
    type: 'string',
    modifying: true,
    errors: true
});

export default ajv;

interface ValidateOptions {
    schema: Schema;
    data: unknown;
    clone?: boolean;
}
export const validate = <T>({
    schema,
    data,
    clone = true
}: ValidateOptions): T => {
    const result = clone ? _.cloneDeep(data) : data;
    const validate = ajv.compile<T>(schema);
    if (validate(result)) {
        return result;
    } else {
        throw new Error(JSON.stringify(validate.errors));
    }
}