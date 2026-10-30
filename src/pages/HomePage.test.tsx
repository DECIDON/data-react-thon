import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

/**
 * Rendu de l'accueil, **Nivo mocké à la frontière** (C-009) : on teste la réaction de
 * l'app (URL, panneau du jour, vitrine), pas le SVG. Le mock peint un bouton par jour
 * reçu du calendrier, libellé de sa date ISO — les assertions restent sur libellés
 * réels, zéro `data-testid` (C-006).
 */
vi.mock('@nivo/calendar', async () => {
  const React = await import('react')
  return {
    ResponsiveCalendar: ({
      data,
      onClick,
    }: {
      data: Array<{ day: string; value: number }>
      onClick?: (datum: { day: string }) => void
    }) =>
      React.createElement(
        'div',
        null,
        data.map((point) =>
          React.createElement(
            'button',
            { key: point.day, type: 'button', onClick: () => onClick?.({ day: point.day }) },
            `${point.day} (${point.value} documents)`,
          ),
        ),
      ),
  }
})

vi.mock('@nivo/pie', async () => {
  const React = await import('react')
  return {
    ResponsivePie: ({ data }: { data: Array<{ id: string }> }) =>
      React.createElement(
        'div',
        null,
        data.map((ligne) => React.createElement('p', { key: ligne.id }, `donut ${ligne.id}`)),
      ),
  }
})

function rendu() {
  return render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>,
  )
}

beforeEach(() => {
  // BrowserRouter écrit dans la vraie history de jsdom : remise à zéro entre tests.
  window.history.replaceState(null, '', '/')
})

describe('HomePage — accueil 1934', () => {
  it('affiche le titre du prototype et la légende du calendrier', () => {
    rendu()
    expect(screen.getByRole('heading', { level: 1, name: 'Presse & palabre' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Le trimestre en un coup d’œil' })).toBeVisible()
    // La légende vit dans un <strong> imbriqué : « textContent inclus », on prend le premier nœud.
    expect(screen.getAllByText(/coupes de presse et prises de parole confondues/)[0]).toBeVisible()
  })

  it('expose les trois sujets vitrine et les sujets non-vitrine en liste discrète', () => {
    rendu()
    for (const label of ['La crise du désarmement', 'La menace des ligues', 'La foire aux valeurs']) {
      const carte = screen.getByRole('link', { name: label })
      expect(carte).toBeVisible()
      expect(carte.getAttribute('href')).toMatch(/^\/sujet\/[a-z0-9-]+$/)
    }
    expect(screen.getByRole('link', { name: 'Le budget et les décrets-lois' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Aussi au registre' })).toBeVisible()
  })

  it('clic sur un jour : l’URL porte ?jour= et le panneau du jour s’ouvre', async () => {
    const user = userEvent.setup()
    rendu()
    // Le corpus des exports commence le 9 janvier 1934 : c'est le premier jour cliquable.
    await user.click(screen.getByRole('button', { name: /^1934-01-09/ }))
    expect(window.location.search).toContain('jour=1934-01-09')
    expect(screen.getByRole('heading', { level: 2, name: 'Documents du 9 janvier 1934' })).toBeVisible()
    // Le diagramme de répartition des sujets du jour accompagne le panneau.
    expect(screen.getByRole('heading', { level: 3, name: 'Répartition des sujets' })).toBeVisible()
    expect(screen.getByText('Prise de parole')).toBeVisible()
    expect(screen.getAllByText('Courrier libre 2 · neutre').length).toBeGreaterThan(0)
  })

  it('re-clic sur le jour retenu : le panneau se referme et ?jour= disparaît', async () => {
    const user = userEvent.setup()
    rendu()
    await user.click(screen.getByRole('button', { name: /^1934-01-09/ }))
    await user.click(screen.getByRole('button', { name: /^1934-01-09/ }))
    expect(window.location.search).not.toContain('jour=')
    expect(screen.queryByRole('heading', { name: 'Documents du 9 janvier 1934' })).toBeNull()
  })

  it('lien profond : ?jour= déjà présent à l’arrivée rend le panneau (survit au rechargement)', () => {
    render(
      <MemoryRouter initialEntries={['/?jour=1934-01-09']}>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Documents du 9 janvier 1934' })).toBeVisible()
    // Une seule prise de parole ce jour-là (pd-00001) : le bandeau date + source la nomme en entier.
    expect(
      screen.getByText('9 janvier 1934 · Compte rendu de la séance de la Chambre du 9 janvier 1934'),
    ).toBeVisible()
  })
})
