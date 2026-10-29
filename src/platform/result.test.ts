import { describe, expect, it } from 'vitest'
import { err, errorOf, ok, valueOf } from './result'

describe('FunctionResult', () => {
  it('ok() porte une valeur et se discrimine par ok === true', () => {
    const result = ok(41 + 1)
    expect(result.ok).toBe(true)
    expect(valueOf(result)).toBe(42)
    expect(errorOf(result)).toBeUndefined()
  })

  it('err() porte une erreur et se discrimine par ok === false', () => {
    const result = err('boom')
    expect(result.ok).toBe(false)
    expect(errorOf(result)).toBe('boom')
    expect(valueOf(result)).toBeUndefined()
  })
})
