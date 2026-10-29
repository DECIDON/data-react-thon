import { describe, expect, it } from 'vitest'
import { PERIODE_1934, estDansLaPeriode } from './periode'

describe('PERIODE_1934', () => {
  it('borne le trimestre figé (spec §1)', () => {
    expect(PERIODE_1934).toEqual({ du: '1934-01-01', au: '1934-03-31' })
  })

  it('accepte les bornes et refuse le dehors', () => {
    expect(estDansLaPeriode('1934-01-01')).toBe(true)
    expect(estDansLaPeriode('1934-02-17')).toBe(true)
    expect(estDansLaPeriode('1934-03-31')).toBe(true)
    expect(estDansLaPeriode('1933-12-31')).toBe(false)
    expect(estDansLaPeriode('1934-04-01')).toBe(false)
  })
})
