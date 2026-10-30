import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BarMois, libelleMois } from './BarMois'

/**
 * BarMois — Nivo mocké à la frontière (C-09 comme partout) : seul le chemin non peint
 * est testable en jsdom, et c'est exactement celui du bug de production : le double
 * formatage du mois en infobulle (RangeError sous ErrorBoundary).
 */
vi.mock('@nivo/bar', () => ({ ResponsiveBar: () => null }))

describe('libelleMois', () => {
  it('traduit un mois ISO en français', () => {
    expect(libelleMois('1934-01')).toBe('janvier 1934')
    expect(libelleMois('1934-12')).toBe('décembre 1934')
  })

  it('rend telle quelle une valeur déjà formatée ou invalide (garde anti-RangeError)', () => {
    expect(libelleMois('janvier 1934')).toBe('janvier 1934')
    expect(libelleMois('n’importe quoi')).toBe('n’importe quoi')
    expect(libelleMois('2034-13')).toBe('2034-13') // mois 13 : parseable ? non — on le rend brut
  })
})

describe('BarMois', () => {
  it('annonce l’absence de série plutôt que de peindre un vide', () => {
    render(<BarMois series={[]} />)
    expect(screen.getByText(/rien à empiler/i)).toBeInTheDocument()
  })
})
