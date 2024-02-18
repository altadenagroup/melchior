import Telegraf from 'telegraf'
import { SceneContextScene } from 'telegraf/scenes'
import { LoadedModule } from './loader.js'

export interface Context extends Telegraf.Context {
  replyHTML: (text: string, extra: any) => Promise<unknown>
  scene: SceneContextScene<Telegraf.Context>
}

export type CommandFunction = (ctx: Context) => never | Promise<never>
export type GuardFunction = (ctx: Context) => boolean | Promise<boolean>

export interface GuardModule extends LoadedModule<GuardFunction> {}

export interface CommandInfo {
  aliases?: string[]
  guards?: string[]
  name: string
}

export interface CommandModule extends LoadedModule<CommandFunction> {
  info?: CommandInfo
}
