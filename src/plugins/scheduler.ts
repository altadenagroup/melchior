import { Client, Plugin } from '../structures/index.js'
import { error, importAll, info } from '../tools/index.js'
import { SchedulerModule } from '../types/index.js'
import cron from 'node-cron'

export interface SchedulerConfiguration {
  directory: string
  timezone?: string
}

export class SchedulerPlugin extends Plugin {
  identifier = 'scheduler'

  constructor(public config: SchedulerConfiguration) {
    super()
  }

  onUnload() {
    // unimplemented
  }

  async onLoad(client: Client) {
    await super.onLoad(client)

    let loadedSchedules = 0
    const schedules = await importAll<SchedulerModule>(
      this.config.directory,
      (module, fileName) => {
        if (!module.schedule || !cron.validate(module.schedule)) {
          error(
            'plugins.scheduler',
            `invalid schedule provided on file ${fileName}: ${module.schedule}`
          )
          throw new Error("can't proceed with invalid schedule")
        }
        loadedSchedules++
      }
    )

    schedules.forEach((schedule: SchedulerModule) => {
      cron.schedule(schedule.schedule, schedule.default)
    })

    info('plugins.scheduler', `loaded ${loadedSchedules} cron schedules`)
  }
}
