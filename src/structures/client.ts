import { Telegraf, session } from 'telegraf'
import { debug, error, info } from '../tools/index.js'
import { ClientOptions, Context } from '../types/index.js'
import { Plugin } from './plugin.js'

const clientDefaultOptions: ClientOptions = {
  plugins: [],
  errorThreshold: 5,
  sessionStore: undefined,
  useSessions: true,
  middlewares: []
}

export class Client extends Telegraf<Context> {
  #melchiorOptions: ClientOptions
  #errorCounter = 0

  constructor(
    token: string,
    options?: ClientOptions,
    telegrafOpts: Partial<Telegraf.Options<Context>> | undefined = undefined
  ) {
    super(token, telegrafOpts)
    // apply defaults if given options are not complete
    this.#melchiorOptions = { ...clientDefaultOptions, ...options }

    process.once('SIGINT', () => this.stop('SIGINT'))
    process.once('SIGTERM', () => this.stop('SIGTERM'))

    if (options?.middlewares) {
      for (const middleware of options.middlewares) {
        this.use(middleware)
      }
    }

    if (options?.sessionStore) {
      this.use(
        session({
          store: options?.sessionStore,
          getSessionKey: options?.getSessionKey
        })
      )
    } else if (options?.useSessions) {
      this.use(session({ getSessionKey: options?.getSessionKey }))
    }

    if (process.env.MELCHIOR_LOAD_PLUGINS_BEFORE_INIT === 'true') {
      this.launchPlugins().then(() =>
        info('melchior', 'plugins were early loaded')
      )
    }

    setInterval(() => (this.#errorCounter = 0), 20000)
    setTimeout(() => {
      if (this.#errorCounter > 10) {
        error(
          'melchior',
          'too many errors during early execution, stopping the bot'
        )
        process.exit(1)
      } else {
        debug('melchior', 'early execution phase preceeded without errors')
      }
    }, 4000)
  }

  isBotHealthy(): Promise<boolean> {
    return new Promise(async (resolve) => {
      // check if process has been up for at least 10 seconds
      if (process.uptime() < 10)
        await new Promise((r) => setTimeout(r, 15000 - process.uptime() * 1000))

      // check error threshold
      if (this.#errorCounter >= this.#melchiorOptions.errorThreshold)
        return resolve(false)

      // check if the bot is responding
      const response = await this.telegram.getMe().catch(() => null)
      if (!response) return resolve(false) // immediately return false if the telegram api is not responding

      // run custom health check
      const customHealthCheck = await this.healthCheck()
      if (!customHealthCheck) return resolve(false)

      return resolve(true)
    })
  }

  /// Custom health check function. Implement your own logic here by overriding this method.
  healthCheck(): Promise<boolean> {
    return Promise.resolve(true)
  }

  async launchPlugins() {
    await Promise.all(
      this.#melchiorOptions.plugins.map((plugin) => this.#loadPlugin(plugin))
    )
  }

  // @ts-ignore
  public override async launch(
    conf: Telegraf.LaunchOptions = {},
    onLaunch?: () => void
  ) {
    await this.launchPlugins()
    const start: () => Promise<any> = () =>
      super.launch(conf || {}, onLaunch).catch((err) => {
        error('melchior', `got an error:\n${err.stack}`)
        this.#errorCounter++
        return start()
      })

    return start()
  }

  stop(reason: string) {
    info('melchior', `stopping client due to ${reason}`)
    this.#melchiorOptions.plugins.forEach((plugin) =>
      this.#unloadPlugin(plugin)
    )
    if (this.botInfo) super.stop(reason)
    const nonErrorExitCodes = ['SIGINT', 'SIGTERM']
    process.exit(nonErrorExitCodes.includes(reason) ? 0 : 1)
  }

  async #loadPlugin(plugin: Plugin) {
    await plugin.onLoad(this)
    debug('melchior', `loaded plugin ${plugin.identifier}`)
  }

  #unloadPlugin(plugin: Plugin) {
    plugin.onUnload()
    debug('melchior', `unloaded plugin ${plugin.identifier}`)
  }
}
