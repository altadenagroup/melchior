import { Client } from './client.js'

export abstract class Plugin {
  abstract identifier: string
  protected client: Client | undefined
  async onLoad(client: Client) {
    this.client = client
  }
  abstract onUnload(): void
}
