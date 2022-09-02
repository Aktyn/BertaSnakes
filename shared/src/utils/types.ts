/* eslint-disable @typescript-eslint/no-explicit-any */
type NonObjectKeysOf<T> = {
  [K in keyof T]: T[K] extends Array<never>
    ? K
    : T[K] extends object
    ? never
    : K
}[keyof T]

type ValuesOf<T> = T[keyof T]
type ObjectValuesOf<T> = Exclude<
  Exclude<Extract<ValuesOf<T>, object>, never>,
  Array<never>
>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never

type DfBase<T, Recursor> = Pick<T, NonObjectKeysOf<T>> &
  UnionToIntersection<Recursor>

export type DeepFlatten<T> = T extends any
  ? DfBase<T, Df2<ObjectValuesOf<T>>>
  : never
type Df2<T> = T extends any ? DfBase<T, Df3<ObjectValuesOf<T>>> : never
type Df3<T> = T extends any ? DfBase<T, Df4<ObjectValuesOf<T>>> : never
type Df4<T> = T extends any ? DfBase<T, Df5<ObjectValuesOf<T>>> : never
type Df5<T> = T extends any ? DfBase<T, Df6<ObjectValuesOf<T>>> : never
type Df6<T> = T extends any ? DfBase<T, Df7<ObjectValuesOf<T>>> : never
type Df7<T> = T extends any ? DfBase<T, Df8<ObjectValuesOf<T>>> : never
type Df8<T> = T extends any ? DfBase<T, Df9<ObjectValuesOf<T>>> : never
type Df9<T> = T extends any ? DfBase<T, ObjectValuesOf<T>> : never
