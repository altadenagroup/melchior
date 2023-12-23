import { info, error, warning } from '../../../tools/index.js'
import { DatabaseSchema, FilterObject, DatabaseItem } from '../schemas.js'

export abstract class Provider {
  abstract name: string
  abstract shouldEarlyConnect?: boolean
  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract registerSchema(name: string, schema: DatabaseSchema): void
  abstract retriveSchema<T extends DatabaseSchema>(
    name: string
  ): ProviderModel<T> | undefined

  info(m: string) {
    info(`plugins.database.${this.name}`, m)
  }

  error(m: string) {
    error(`plugins.database.${this.name}`, m)
  }

  warning(m: string) {
    warning(`plugins.database.${this.name}`, m)
  }
}

export abstract class ProviderModel<T extends DatabaseSchema> {
  abstract findOne(
    filter: FilterObject<T>
  ): Promise<DatabaseItem<T> | undefined | null>
  abstract findMany(filter: FilterObject<T>): Promise<DatabaseItem<T>[]>
  abstract insertOne(item: DatabaseItem<T>): Promise<void>
  abstract insertMany(items: DatabaseItem<T>[]): Promise<void>
  abstract updateOne(
    filter: FilterObject<T>,
    item: DatabaseItem<T>
  ): Promise<void>
  abstract updateMany(
    filter: FilterObject<T>,
    item: DatabaseItem<T>
  ): Promise<void>
  abstract deleteOne(filter: FilterObject<T>): Promise<void>
  abstract deleteMany(filter: FilterObject<T>): Promise<void>
}
