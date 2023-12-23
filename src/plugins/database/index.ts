import { importAll } from '../../index.js'
import { Plugin } from '../../structures/index.js'
import { Provider, ProviderModel } from './providers/provider.js'
import { DatabaseSchema, SchemaModule } from './schemas.js'

export { MongoDBProvider } from './providers/mongodb.js'
export { Provider, ProviderModel } from './providers/provider.js'
export { field } from './schemas.js'

export interface DatabaseConfiguration {
  schemaDirectory: string
  redisURL?: string
}

export class DatabasePlugin extends Plugin {
  identifier = 'database'
  #utilityFunctions = new Map<string, unknown>()
  #schemaAliases = new Map<string, string>()

  constructor(
    public provider: Provider,
    public config: DatabaseConfiguration
  ) {
    super()
  }

  async onLoad() {
    if (this.provider.shouldEarlyConnect) {
      await this.provider.connect()
    }

    await importAll<SchemaModule>(
      this.config.schemaDirectory,
      (schema, fileName) => {
        // remove .js from the end of the file name, capitalize the first letter
        let normalizedFileName = fileName.replace(/\.js$/, '')
        normalizedFileName =
          normalizedFileName[0].toUpperCase() + normalizedFileName.slice(1)
        // if the last letter is an s, remove it
        if (normalizedFileName.endsWith('s')) {
          normalizedFileName = normalizedFileName.slice(0, -1)
        }

        this.provider.registerSchema(normalizedFileName, schema.default)
        // remove the default export from the schema and save everything else to the utility functions
        const { default: _, ...utilityFunctions } = schema
        this.#utilityFunctions.set(normalizedFileName, utilityFunctions)
        this.#schemaAliases.set(
          fileName.replace(/\.js$/, ''),
          normalizedFileName
        )
      }
    )
  }

  in<T extends DatabaseSchema, M>(name: string): ProviderModel<T> & M {
    name = this.#schemaAliases.get(name) || name
    const model = this.provider.retriveSchema(name) as ProviderModel<T> & M
    if (!model) throw new Error(`Could not find model ${name}`)
    let utilityFunctions = this.#utilityFunctions.get(name) || {}
    // bind the utility functions to the model
    for (const util in utilityFunctions) {
      utilityFunctions[util] = utilityFunctions[util].bind(model)
    }
    return Object.assign(model, utilityFunctions)
  }

  onUnload() {
    return this.provider.disconnect()
  }
}
