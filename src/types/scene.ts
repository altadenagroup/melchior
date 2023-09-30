import { Context, Scenes } from 'telegraf'
import { LoadedModule } from './loader.js'

export interface SceneModule extends LoadedModule<Scenes.BaseScene<Context>> {}
