import type { DeepFlatten } from './types'

export const int = (value?: unknown) => parseInt((value as string) ?? '') || 0
export const float = (value?: unknown) =>
  parseFloat((value as string) ?? '') || 0

export function pick<ObjectType, Key extends keyof ObjectType>(
  object: ObjectType,
  ...keys: Key[]
) {
  const picked = {} as Pick<ObjectType, Key>
  for (const key of keys) {
    picked[key] = object[key]
  }
  return picked
}

export function omit<ObjectType, Key extends keyof ObjectType>(
  object: ObjectType,
  ...keys: Key[]
) {
  const omitted = {} as Omit<ObjectType, Key>
  const keysSet = new Set<keyof ObjectType>(keys)
  for (const objectKey in object) {
    if (!keysSet.has(objectKey)) {
      omitted[objectKey as unknown as Exclude<keyof ObjectType, Key>] =
        object[objectKey as unknown as Exclude<keyof ObjectType, Key>]
    }
  }
  return omitted
}

function isObject(obj: unknown) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

type PossibleDeepFlatten<ObjectType> = ObjectType extends null
  ? null
  : ObjectType extends Array<never>
  ? ObjectType
  : ObjectType extends Record<string, unknown>
  ? DeepFlatten<ObjectType>
  : ObjectType

export function flattenObject<ObjectType>(
  deepObject: ObjectType,
): PossibleDeepFlatten<ObjectType> {
  if (!isObject(deepObject)) {
    return deepObject as PossibleDeepFlatten<ObjectType>
  }

  const flatObject = {} as Record<string, unknown>
  for (const key in deepObject) {
    const value = deepObject[key]
    if (isObject(value)) {
      Object.assign(flatObject, flattenObject(value as Record<string, unknown>))
    } else {
      flatObject[key] = value
    }
  }
  return flatObject as PossibleDeepFlatten<ObjectType>
}
