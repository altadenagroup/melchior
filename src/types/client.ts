import { SessionStore } from 'telegraf'
import { Plugin } from '../structures/index.js'

export interface ClientOptions {
  /// Plugins to load
  plugins: Plugin[]
  /// How many errors should be tolerated in a 20 seconds window before marking the bot as unhealthy
  errorThreshold: number
  /// The store for the session middleware.
  sessionStore: SessionStore<{}> | undefined
}
