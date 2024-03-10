import { Context, MiddlewareFn, SessionStore } from 'telegraf'
import { Plugin } from '../structures/index.js'

export interface ClientOptions {
  /// Plugins to load
  plugins: Plugin[]
  /// How many errors should be tolerated in a 20 seconds window before marking the bot as unhealthy
  errorThreshold: number
  /// The store for the session middleware.
  sessionStore?: SessionStore<{}>
  /// A custom function to be used when retriving sessions from memory. Useful for advanced scenes that'll take in more than one user's input.
  getSessionKey?: (ctx: Context) => Promise<string | undefined>
  /// Tells melchior whether it should automatically add the telegraf session middleware.
  useSessions?: boolean
  /// Specifies middleware to be loaded before melchior's own middlewares (such as the session middleware)
  middlewares: MiddlewareFn<Context>[]
}
