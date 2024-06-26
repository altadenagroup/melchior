import { Scenes } from 'telegraf'
import { Client, Plugin } from '../structures/index.js'
import { error, importAll, info } from '../tools/index.js'
import {
  CommandInfo,
  CommandModule,
  Context,
  GuardFunction,
  GuardModule,
  SceneModule
} from '../types/index.js'
import * as Sentry from '@sentry/node'

export interface CommandLoaderConfiguration {
  commandDirectory: string
  guardDirectory?: string
  sceneDirectory?: string
}

export class CommandLoaderPlugin extends Plugin {
  identifier = 'commandLoader'
  registry = new Map<string, CommandModule>()
  guards = new Map<string, GuardFunction>()

  constructor(public config: CommandLoaderConfiguration) {
    super()
  }

  onUnload() {
    this.unloadCommands()
  }

  async runCommand(name: string, ctx: Context) {
    const command = this.findCommand(name)
    if (!command) return
    const { info = {}, default: fn } = command
    const { guards = [] } = info as CommandInfo
    const guardFunctions = guards.map((guard) => this.guards.get(guard))
    const guardResults = await Promise.all(
      guardFunctions.map((guard) => guard?.(ctx))
    )
    if (guardResults.some((result) => result === false)) return

    Sentry.metrics.increment('command-runs', 1, { tags: { name } })
    return Sentry.startSpan(
      {
        op: 'melchior.telegram-command',
        name
      },
      async () => {
        Sentry.setContext('cmd', {
          msg: ctx.message,
          user: ctx.from,
          chat: ctx.chat
        })
        try {
          const r = await fn(ctx).catch((error) => ({ error }))
          if (r?.error) throw r.error
          return r
        } catch (e: any) {
          error(
            'plugins.commandLoader',
            `got an error while executing ${name}: ${e.stack}`
          )
          Sentry.captureException(e)
          return e
        }
      }
    )
  }

  findCommand(name: string) {
    return (
      this.registry.get(name) ??
      Array.from(this.registry.values()).find((cmd) =>
        cmd.info?.aliases?.includes?.(name)
      )
    )
  }

  async onLoad(client: Client, loadOnlyCommands = false) {
    await super.onLoad(client)

    if (!loadOnlyCommands && this.config.sceneDirectory) {
      let loadedScenes = 0
      const scenes = await importAll<SceneModule>(
        this.config.sceneDirectory,
        () => {
          loadedScenes++
        }
      )
      // FIXME: figure out how to type this
      client.use(
        // @ts-expect-error but for now, it should work
        new Scenes.Stage(scenes.map((scene) => scene.default)).middleware()
      )
      info('plugins.commandLoader', `loaded ${loadedScenes} scenes`)
    }

    let loadedCommands = 0

    await importAll<CommandModule>(
      this.config.commandDirectory,
      (module, fileName) => {
        const name =
          module.info?.name ?? fileName.replace('.js', '').replace('.ts', '')
        const info = { ...(module.info || {}), name }
        this.registry.set(name, { default: module.default, info })
        client.command(info.name, this.#wrap(info.name))
        info.aliases?.forEach?.((alias) =>
          client.command(alias, this.#wrap(info.name))
        )
        loadedCommands++
      }
    )

    info('plugins.commandLoader', `loaded ${loadedCommands} commands`)

    if (!loadOnlyCommands && this.config.guardDirectory) {
      let loadedGuards = 0
      await importAll<GuardModule>(
        this.config.guardDirectory,
        (module, fileName) => {
          const name = fileName.replace('.js', '').replace('.ts', '')
          this.guards.set(name, module.default)
          loadedGuards++
        }
      )
      info('plugins.commandLoader', `loaded ${loadedGuards} guards`)
    }
  }

  unloadCommands() {
    this.registry = new Map()
  }

  reloadCommands() {
    this.unloadCommands()
    return this.onLoad(this.client!, true)
  }

  #wrap(name: string) {
    return async (ctx: Context) => {
      return this.runCommand(name, ctx)
    }
  }
}
