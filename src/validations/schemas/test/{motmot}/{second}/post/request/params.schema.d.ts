
/* tslint:disable */
/**
* This file was automatically generated by json-to-ts.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run generate-schema-types.ts to regenerate this file.
*/
interface RootObject {
  type: string;
  properties: Properties;
  additionalProperties: boolean;
  required: string[];
}

interface Properties {
  motmot: Motmot;
  second: Motmot;
}

interface Motmot {
  type: string;
  description: string;
  example: string;
}

declare const _default: RootObject;
export default _default;