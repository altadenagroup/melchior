import { field } from '../../../lib/plugins/index.js'

export default {
  telegramID: field({ type: Number, index: true }),
  isBanned: field({ defaultValue: false }), // it infers types based on the default value
  updatedOn: field({ type: Date, defaultValue: Date.now }) // but, in some cases, it's better to define the type
  // could be field<Date>({ default: Date.now }) on typescript
}

export function findByID(id) {
  return this.findOne({ telegramID: id })
}
export function create(id) {
  return this.insertOne({ telegramID: id })
}
