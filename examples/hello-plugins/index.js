import { Client } from '../../lib/module/index.js'
import { CommandLoaderPlugin } from '../../lib/module/plugins/command-loader.js'

const client = new Client('6406536723:AAEBs-oN2mc3zjSPpZfhLMhmzcdvaoXYOzE', {
  plugins: [
    new CommandLoaderPlugin({
      commandDirectory: './examples/hello-plugins/commands'
    })
  ]
})

client.launch()
