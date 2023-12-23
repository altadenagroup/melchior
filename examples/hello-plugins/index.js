import { Client } from '../../lib/index.js'
import { CommandLoaderPlugin } from '../../lib/plugins/command-loader.js'
import { DatabasePlugin, MongoDBProvider } from '../../lib/plugins/index.js'

const client = new Client(
  process.env.TOKEN || '6406536723:AAEBs-oN2mc3zjSPpZfhLMhmzcdvaoXYOzE',
  {
    plugins: [
      new CommandLoaderPlugin({
        commandDirectory: './commands'
      }),
      new DatabasePlugin(
        new MongoDBProvider({
          url: 'mongodb://localhost:27017/test'
        }),
        {
          schemaDirectory: './schemas'
        }
      )
    ]
  }
)

client.launch()
