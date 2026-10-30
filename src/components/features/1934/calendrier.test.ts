import { describe, expect, it } from 'vitest'
import { echelleDegrade, jourSelectionne, versCalendrier } from './calendrier'

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

describe('echelleDegrade', () => {
  const NOIR_BLANC = ['#000000', '#ffffff']
  const TROIS_PALIERS = ['#000000', '#808080', '#ffffff']

  it('ancre la rampe sur le min et le max réellement présents dans les valeurs', () => {
    const echelle = echelleDegrade([2, 4, 10], NOIR_BLANC)
    expect(echelle(2)).toBe('#000000') // min → première teinte
    expect(echelle(10)).toBe('#ffffff') // max → dernière teinte
    expect(echelle(6)).toBe('#808080') // à mi-chemin du domaine → mélange linéaire
  })

  it('interpole entre les paliers d’une rampe à trois teintes', () => {
    const echelle = echelleDegrade([0, 8], TROIS_PALIERS)
    expect(echelle(4)).toBe('#808080') // milieu de rampe, palier médian pile
    expect(echelle(2)).toBe('#404040') // quart de rampe, mélangé entre paliers 0 et 1
  })

  it('borne les valeurs hors domaine plutôt que de déborder de la rampe', () => {
    const echelle = echelleDegrade([3, 7], NOIR_BLANC)
    expect(echelle(0)).toBe('#000000')
    expect(echelle(99)).toBe('#ffffff')
  })

  it('sans variation, rend le milieu de la rampe, jamais une division par zéro', () => {
    const echelle = echelleDegrade([5, 5, 5], NOIR_BLANC)
    expect(echelle(5)).toBe('#808080')
  })

  it('expose des ticks réguliers entre min et max (contrat ColorScale de Nivo)', () => {
    const echelle = echelleDegrade([2, 10], NOIR_BLANC)
    expect(echelle.ticks(3)).toEqual([2, 6, 10])
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
