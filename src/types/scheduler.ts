import { LoadedModule } from './loader.js'

export type SchedulerFunction = () => never | Promise<never>

export interface SchedulerModule extends LoadedModule<SchedulerFunction> {
  schedule: string
}
