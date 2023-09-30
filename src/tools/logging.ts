const ASCII_COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m',
  FX_BOLD: '\x1b[1m',
  FX_DIM: '\x1b[2m',
  FX_ITALIC: '\x1b[3m',
  FX_UNDERLINE: '\x1b[4m',
  FX_BLINK: '\x1b[5m',
  FX_REVERSE: '\x1b[7m',
  FX_HIDDEN: '\x1b[8m'
}

type Printable = string | number | never
type LogFn = [scope: string, message: Printable]

const useColors = process.env.DISABLE_COLORS !== 'true'
const reverseIdentifier =
  process.env.REVERSE_IDENTIFIER ?? 'space.altadena.melchior'

const c = (color: keyof typeof ASCII_COLORS, text: string) =>
  useColors ? `${ASCII_COLORS[color]}${text}${ASCII_COLORS.RESET}` : text
const date = () => c('FX_DIM', new Date().toISOString())
const log = (level: string, scope: string, message: Printable) => {
  const sc = c('FX_DIM', scope)
  console.log(`${reverseIdentifier} ${date()} ${level} ${sc}: ${message}`)
}

export const info = (...m: LogFn) => log(c('BG_BLUE', '[INF]'), ...m)
export const error = (...m: LogFn) => log(c('BG_RED', '[ERR]'), ...m)
export const warning = (...m: LogFn) => log(c('BG_YELLOW', '[WAR]'), ...m)
export const debug = (...m: LogFn) =>
  process.env.DEBUGGING && log(c('BG_MAGENTA', '[DBG]'), ...m)
export const errorCallback = (name: string) => {
  return (err: Error) => error(name, `${err.message}\n${err.stack}`)
}
