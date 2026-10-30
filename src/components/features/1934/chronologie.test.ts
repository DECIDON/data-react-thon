import type { PointChronologie } from '@/domain/1934'
import { describe, expect, it } from 'vitest'
import {
  couleurSerie,
  idSerie,
  libelleBande,
  libelleMoisAxe,
  moisDeLaPeriode,
  versBandesChronologie,
} from './chronologie'

/**
 * Adaptateur de la frise AreaBump : la mise en bandes (couloir × polarité), le comptage
 * par mois avec padding de zéros et la lecture couleur/libellé depuis l'id de série sont
 * les pièces testables sans Nivo ni DOM (le tracé lui-même ne se teste pas ici).
 */

const points: PointChronologie[] = [
  { id: 'pd-001', date: '1934-01-03', lane: 'parlement', polarity: 'positif' },
  { id: 'pd-004', date: '1934-01-20', lane: 'parlement', polarity: 'positif' },
  { id: 'cp-002', date: '1934-02-04', lane: 'presse', polarity: 'negatif' },
  { id: 'hors-sol', date: '1933-12-25', lane: 'presse', polarity: 'neutre' }, // hors période
]

describe('moisDeLaPeriode', () => {
  it('un mois par mois de la période, croissants, zéros compris', () => {
    expect(moisDeLaPeriode()).toEqual(['1934-01', '1934-02', '1934-03'])
  })

  it('gère le passage à l’année suivante', () => {
    expect(moisDeLaPeriode('1933-11-02', '1934-02-28')).toEqual(['1933-11', '1933-12', '1934-01', '1934-02'])
  })
})

describe('versBandesChronologie', () => {
  it('une bande par couple couloir × polarité présent, presse d’abord, ordre des polarités stable', () => {
    const series = versBandesChronologie(points)
    expect(series.map((s) => s.id)).toEqual(['presse:negatif', 'parlement:positif'])
  })

  it('compte par mois, padding de zéros sur toute la période : la bande traverse toutes les colonnes', () => {
    const series = versBandesChronologie(points)
    expect(series[0]?.data).toEqual([
      { x: '1934-01', y: 0 },
      { x: '1934-02', y: 1 },
      { x: '1934-03', y: 0 },
    ])
    expect(series[1]?.data).toEqual([
      { x: '1934-01', y: 2 },
      { x: '1934-02', y: 0 },
      { x: '1934-03', y: 0 },
    ])
  })

  it('un point hors de la période n’est pas compté', () => {
    const series = versBandesChronologie(points)
    expect(series.some((s) => s.id === 'presse:neutre')).toBe(false)
  })

  it('lot vide : aucune bande (le composant affiche l’état vide)', () => {
    expect(versBandesChronologie([])).toEqual([])
  })
})

describe('libelleBande & libelleMoisAxe', () => {
  it('le libellé de bande se relit depuis l’id (« parlement:negatif » → « Parlement · négatif »)', () => {
    expect(libelleBande({ id: 'parlement:negatif' })).toBe('Parlement · négatif')
    expect(libelleBande({ id: 'presse:positif' })).toBe('Presse · positif')
  })

  it('un id imprévu s’affiche brut plutôt que de mentir', () => {
    expect(libelleBande({ id: 'mars:inconnu' })).toBe('mars:inconnu')
    expect(libelleBande({ id: 'sans-deux-points' })).toBe('sans-deux-points')
  })

  it('l’axe X parle français', () => {
    expect(libelleMoisAxe('1934-02')).toBe('février 1934')
  })
})

describe('idSerie & couleurSerie', () => {
  it('l’id de série encode le couple (couleur relue depuis l’id)', () => {
    expect(idSerie('parlement', 'neutre')).toBe('parlement:neutre')
    expect(couleurSerie('presse:positif')).toBe('#059669')
    expect(couleurSerie('parlement:negatif')).toBe('#dc2626')
    expect(couleurSerie('presse:neutre')).toBe('#a3a3a3')
  })

  it('un id méconnu retombe sur le gris neutre (jamais de trou de couleur)', () => {
    expect(couleurSerie('mars:inconnu')).toBe('#a3a3a3')
    expect(couleurSerie('sans-deux-points')).toBe('#a3a3a3')
  })
})
