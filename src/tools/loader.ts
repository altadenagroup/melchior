import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LoadCallback, LoadedModule } from '../types/index.js'

const defaultFunction = () => {}

export const importAll = async <T extends LoadedModule<any>>(
  directory: string,
  cb: LoadCallback<T> = defaultFunction
) => {
  const list = readdirSync(resolve(directory)).filter(
    (a) => a.endsWith('.js') || a.endsWith('.mjs')
  )
  const d = await Promise.all(
    list.map((r) => import('file://' + resolve(directory, r))) as Promise<T>[]
  )
  d.forEach((m, i) => cb(m, list[i]))
  return d
}

export const loadJSONFromDirectory = (directory: string) => {
  const list = readdirSync(resolve(directory)).filter((a) =>
    a.endsWith('.json')
  )
  const objs = list
    .map((r) => readFileSync(resolve(directory, r), 'utf-8'))
    .map((raw, i) => {
      const key = list[i].replace('.json', '')
      return { [key]: JSON.parse(raw) }
    })
  return objs.reduce((a, v) => ({ ...a, ...v }), {})
}
