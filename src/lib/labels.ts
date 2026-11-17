/** Merge partial label overrides over the defaults; an explicit `undefined` keeps the default. */
export function mergeLabels<T extends object>(defaults: T, overrides?: Partial<T>): T {
  const merged = { ...defaults }
  for (const key of Object.keys(overrides ?? {}) as (keyof T)[]) {
    const value = overrides?.[key]
    if (value !== undefined) merged[key] = value as T[keyof T]
  }
  return merged
}
