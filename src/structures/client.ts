import { session, Telegraf } from 'telegraf'
import { info } from '../tools/index.js'
import { ClientOptions, Context } from '../types/index.js'
import { Plugin } from './plugin.js'

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
    this.use(this.#middleware)
  }

  public async launch() {
    await Promise.all(
      this.#melchiorOptions.plugins.map((plugin) => this.#loadPlugin(plugin))
    )

    const start: () => Promise<any> = () =>
      super.launch().catch((err) => {
        info('melchior', `got an error: ${err}; will try again now`)
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
  }

  #middleware(ctx: Context, next: () => Promise<void>) {
    ctx.replyHTML = (text: string, extra: any) =>
      ctx.reply(text, { ...(extra ?? {}), parse_mode: 'HTML' })
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
