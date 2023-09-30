export type LoadCallback<T extends LoadedModule<any>> = (
  module: T,
  fileName: string
) => void

export interface LoadedModule<DefaultExportType> {
  default: DefaultExportType
}
