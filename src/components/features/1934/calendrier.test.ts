import { describe, expect, it } from 'vitest'
import { jourSelectionne, versCalendrier } from './calendrier'

/**
 * Adaptateur calendrier : la transformation `JourCorpus[] → { day, value }[]` et la
 * lecture du paramètre d'URL `?jour=` sont les deux pièces testables sans DOM ni Nivo.
 */
describe('versCalendrier', () => {
  it('somme coupes et prises pour l’intensité du jour (spec §4.1)', () => {
    const jours = [
      { date: '1934-01-03', coupes: 0, prises: 1 },
      { date: '1934-01-15', coupes: 2, prises: 3 },
    ]
    expect(versCalendrier(jours)).toEqual([
      { day: '1934-01-03', value: 1 },
      { day: '1934-01-15', value: 5 },
    ])
  })

  it('ne réinvente aucun jour : les dates absentes restent à peindre par Nivo', () => {
    expect(versCalendrier([{ date: '1934-02-07', coupes: 1, prises: 0 }])).toEqual([
      { day: '1934-02-07', value: 1 },
    ])
  })
})

describe('jourSelectionne', () => {
  it('accepte une date ISO de la période', () => {
    expect(jourSelectionne('1934-01-03')).toBe('1934-01-03')
    expect(jourSelectionne('1934-03-31')).toBe('1934-03-31') // borne incluse
  })

  it('rejette l’absence, le mal-formé et l’hors-période sans broncher', () => {
    expect(jourSelectionne(null)).toBeNull()
    expect(jourSelectionne('tout')).toBeNull()
    expect(jourSelectionne('1934-1-3')).toBeNull()
    expect(jourSelectionne('1933-12-31')).toBeNull() // avant le trimestre
    expect(jourSelectionne('1934-04-01')).toBeNull() // après le trimestre
  })
})
