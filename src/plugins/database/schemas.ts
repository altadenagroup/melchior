import { debug } from '../../index.js'
import { LoadedModule } from '../../types/loader.js'

export interface DatabaseSchema {
  [prop: string]: SchemaField<unknown>
}

export type DatabaseItem<T extends DatabaseSchema> = {
  [prop in keyof T]: any
}

export class SchemaField<T> {
  constructor(
    public index: boolean,
    public defaultValue: T | undefined,
    public type: Function
  ) {}
}

export type FilterObject<T extends DatabaseSchema> = {
  [prop in keyof T]: any
}

export interface SchemaModule extends LoadedModule<DatabaseSchema> {}

export function field<T>({ defaultValue, index = false, type }) {
  debug(
    'plugins.database',
    `Creating ${
      index ? 'indexed ' : ''
    }field definition with type ${type?.name} and default value ${defaultValue}`
  )
  // if there's no type and no default value, throw an error
  if (!type && defaultValue === undefined) {
    throw new Error(
      'You must provide either a type or a default value for a field'
    )
  }

  // if there's no type but there is a default value, infer the type from the default value
  if (!type && defaultValue !== undefined) {
    if (defaultValue === Date.now) {
      type = Date
    } else {
      // if the default value type is a primitive, use the constructor
      if (
        typeof defaultValue === 'string' ||
        typeof defaultValue === 'number' ||
        typeof defaultValue === 'boolean'
      ) {
        type = defaultValue.constructor
      }
    }
  }

  return new SchemaField<T>(index, defaultValue, type)
}
