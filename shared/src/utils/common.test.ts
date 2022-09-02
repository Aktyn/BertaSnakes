import { pick, omit, flattenObject } from './common'

describe('pick', () => {
  it('should return object left only with given properties', () => {
    expect(pick({ a: 5, b: 6, c: 7 }, 'a', 'b')).toStrictEqual({ a: 5, b: 6 })
  })
})

describe('omit', () => {
  it('should return object without given properties', () => {
    expect(omit({ a: 5, b: 6, c: 7 }, 'a', 'b')).toStrictEqual({ c: 7 })
  })
})

describe('flattenObject', () => {
  it('should return flatten version of given object', () => {
    expect(flattenObject({ a: 1, b: 2, c: { d: 3, e: 4 } })).toStrictEqual({
      a: 1,
      b: 2,
      d: 3,
      e: 4,
    })
  })

  it('should copy null properties and not destroy arrays', () => {
    expect(
      flattenObject({ a: 1, b: null, c: { d: 3, e: [1, 2, 3] } }),
    ).toStrictEqual({
      a: 1,
      b: null,
      d: 3,
      e: [1, 2, 3],
    })
  })
})
