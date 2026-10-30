import type { Document1934, PointChronologie } from '@/domain/1934'
import { describe, expect, it } from 'vitest'
import { couleurSerie, idSerie, versSériesChronologie } from './chronologie'

/**
 * Adaptateur de la frise : la mise en séries (couloir × polarité), l'enrichissement par
 * document et la lecture de couleur depuis l'id de série sont les pièces testables sans
 * Nivo ni DOM (les specs §4.2 et §5 se jouent là).
 */

const prise: Document1934 = {
  id: 'pd-001',
  date: '1934-01-03',
  source: { title: 'Compte rendu de séance', url: null },
  content: 'Une intervention.',
  speaker: { name: 'Aurélien Duscher', chamber: 'chambre' },
  subjects: [{ topicId: 'desarmement', polarity: 'positif' }],
}
const coupe: Document1934 = {
  id: 'cp-002',
  date: '1934-02-04',
  source: { title: 'Le Torchon lorrain — édition du 4 janvier', url: null },
  content: 'Un entrefilet.',
  subjects: [{ topicId: 'desarmement', polarity: 'negatif' }],
}
const points: PointChronologie[] = [
  { id: 'pd-001', date: '1934-01-03', lane: 'parlement', polarity: 'positif' },
  { id: 'cp-002', date: '1934-02-04', lane: 'presse', polarity: 'negatif' },
  { id: 'inconnu', date: '1934-02-05', lane: 'presse', polarity: 'neutre' }, // lot désynchronisé
]

describe('versSériesChronologie', () => {
  it('une série par couple couloir × polarité, presse d’abord, ordre des polarités stable', () => {
    const series = versSériesChronologie(points, [coupe, prise])
    expect(series.map((s) => s.id)).toEqual(['presse:negatif', 'parlement:positif'])
  })

  it('points enrichis : x = date ISO, y = libellé français du couloir, doc joint par id', () => {
    const series = versSériesChronologie(points, [coupe, prise])
    expect(series[0]?.data[0]).toEqual({
      id: 'cp-002',
      x: '1934-02-04',
      y: 'Presse',
      polarity: 'negatif',
      doc: coupe,
    })
    expect(series[1]?.data[0]?.y).toBe('Parlement')
  })

  it('un point dont le document est absent du lot ne se peint pas', () => {
    const series = versSériesChronologie(points, [coupe, prise])
    expect(series.every((s) => s.data.every((d) => d.id !== 'inconnu'))).toBe(true)
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
