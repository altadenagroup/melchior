import { session, Telegraf } from 'telegraf'
import { debug, info } from '../tools/index.js'
import { ClientOptions, Context } from '../types/index.js'
import { Plugin } from './plugin.js'
import { DatabasePlugin } from '../plugins/index.js'

const clientDefaultOptions: ClientOptions = {
  plugins: []
}

export class Client extends Telegraf<Context> {
  #melchiorOptions: ClientOptions

  constructor(token: string, options?: ClientOptions) {
    super(token)
    // apply defaults if given options are not complete
    this.#melchiorOptions = { ...clientDefaultOptions, ...options }

    process.once('SIGINT', () => this.stop('SIGINT'))
    process.once('SIGTERM', () => this.stop('SIGTERM'))

    this.use(session())
    this.use(this.#middleware.bind(this))
    if (process.env.MELCHIOR_LOAD_PLUGINS_BEFORE_INIT === 'true') {
      this.#launchPlugins().then(() =>
        info('melchior', 'plugins were early loaded')
      )
    }
  }

  get database(): DatabasePlugin {
    // check if the database plugin is loaded
    const databasePlugin = this.#melchiorOptions.plugins.find(
      (plugin) => plugin.identifier === 'database'
    )
    if (!databasePlugin) {
      throw new Error('Database plugin is not loaded')
    }
    return databasePlugin as DatabasePlugin
  }

  async #launchPlugins() {
    await Promise.all(
      this.#melchiorOptions.plugins.map((plugin) => this.#loadPlugin(plugin))
    )
  }

  public async launch() {
    await this.#launchPlugins()
    const start: () => Promise<any> = () =>
      super.launch().catch((err) => {
        info('melchior', `got an error:\n${err.stack}`)
        return start()
      })

    return start()
  }

  stop(reason: string) {
    info('melchior', `stopping client due to ${reason}`)
    this.#melchiorOptions.plugins.forEach((plugin) =>
      this.#unloadPlugin(plugin)
    )
    super.stop(reason)
    process.exit(0)
  }

  #middleware(ctx: Context, next: () => Promise<void>) {
    ctx.replyHTML = (text: string, extra: any) =>
      ctx.reply(text, { ...(extra ?? {}), parse_mode: 'HTML' })

    ctx.database = this.database
    return next()
  }

  async #loadPlugin(plugin: Plugin) {
    await plugin.onLoad(this)
    info('melchior', `loaded plugin ${plugin.identifier}`)
  }

  #unloadPlugin(plugin: Plugin) {
    plugin.onUnload()
    info('melchior', `unloaded plugin ${plugin.identifier}`)
  }
}
