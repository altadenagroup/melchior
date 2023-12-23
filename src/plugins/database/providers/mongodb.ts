import { DatabaseItem, DatabaseSchema, FilterObject } from '../schemas.js'
import { Provider, ProviderModel } from './provider.js'
import mongoose from 'mongoose'

export interface MongoDBConfiguration {
  url: string
}

export class MongoDBProviderModel<
  T extends DatabaseSchema
> extends ProviderModel<T> {
  constructor(public model: mongoose.Model<any>) {
    super()
  }

  async findOne(
    filter: FilterObject<T>
  ): Promise<DatabaseItem<T> | null | undefined> {
    return this.model.findOne(filter)
  }

  async findMany(filter: FilterObject<T>): Promise<DatabaseItem<T>[]> {
    return this.model.find(filter)
  }

  async insertOne(item: DatabaseItem<T>): Promise<void> {
    await this.model.create(item)
  }

  async insertMany(items: DatabaseItem<T>[]): Promise<void> {
    await this.model.insertMany(items)
  }

  async updateOne(
    filter: FilterObject<T>,
    item: DatabaseItem<T>
  ): Promise<void> {
    await this.model.updateOne(filter, item)
  }

  async updateMany(
    filter: FilterObject<T>,
    item: DatabaseItem<T>
  ): Promise<void> {
    await this.model.updateMany(filter, item)
  }

  async deleteOne(filter: FilterObject<T>): Promise<void> {
    await this.model.deleteOne(filter)
  }

  async deleteMany(filter: FilterObject<T>): Promise<void> {
    await this.model.deleteMany(filter)
  }
}

export class MongoDBProvider extends Provider {
  name = 'mongodb'
  shouldEarlyConnect = true

  constructor(public config: MongoDBConfiguration) {
    super()
  }

  _schemas: Map<string, mongoose.Schema> = new Map()
  _models: Map<string, mongoose.Model<any>> = new Map()

  connect() {
    return mongoose.connect(this.config.url).then(() => {
      this.info('connected to database')
    })
  }

  disconnect() {
    return mongoose.disconnect().then(() => {
      this.info('disconnected from database')
    })
  }

  convertPluginSchemaToMongooseSchema(schema: DatabaseSchema) {
    let assembledSchema = {}
    for (const prop in schema) {
      const val = schema[prop]
      assembledSchema[prop] = {
        type: val.type,
        default: val.defaultValue,
        index: val.index
      }
    }

    return assembledSchema
  }

  registerSchema(name: string, schema: DatabaseSchema): void {
    const schem = new mongoose.Schema(
      this.convertPluginSchemaToMongooseSchema(schema)
    )
    this._schemas.set(name, schem)
    this._models.set(name, mongoose.model(name, schem))
  }

  retriveSchema<T extends DatabaseSchema>(
    name: string
  ): ProviderModel<T> | undefined {
    if (!this._models.has(name)) return undefined
    return new MongoDBProviderModel(this._models.get(name)!)
  }
}
