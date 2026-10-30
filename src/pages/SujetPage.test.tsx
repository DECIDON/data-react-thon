import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { SujetPage } from './SujetPage'

/**
 * Page sujet (étape 9.4), **Nivo mocké à la frontière** (C-009) : le mock scatter peint
 * un bouton par point, libellé de son id de document et de son couloir ; le mock bar
 * peint une ligne par mois. Les assertions restent sur libellés réels (C-006). Une
 * « sonde » rend l'URL courante à côté de la page : c'est l'URL qui est l'état (spec §4).
 */

vi.mock('@nivo/scatterplot', async () => {
  const React = await import('react')
  return {
    ResponsiveScatterPlot: ({
      data,
      onClick,
    }: {
      data: Array<{ id: string; data: Array<{ id: string; x: string; y: string }> }>
      onClick?: (node: { data: { id: string } }) => void
    }) =>
      React.createElement(
        'div',
        null,
        data.flatMap((serie) =>
          serie.data.map((point) =>
            React.createElement(
              'button',
              { key: `${serie.id}-${point.id}`, type: 'button', onClick: () => onClick?.({ data: point }) },
              `${point.id} ${point.x} ${point.y}`,
            ),
          ),
        ),
      ),
  }
})

vi.mock('@nivo/bar', async () => {
  const React = await import('react')
  return {
    ResponsiveBar: ({ data }: { data: Array<Record<string, string | number>> }) =>
      React.createElement(
        'div',
        null,
        data.map((ligne) =>
          React.createElement('span', { key: String(ligne.mois) }, `bar ${String(ligne.mois)}`),
        ),
      ),
  }
})

/** Témoin de l'état-url : la page écrit dans `useSearchParams`, la sonde le lit. */
function Sonde() {
  const [params] = useSearchParams()
  return <p>{`URL: ${params.toString() || '(vide)'}`}</p>
}

function renduSujet(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Sonde />
      <Routes>
        <Route path="/sujet/:id" element={<SujetPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const urlCourante = () => screen.getByText(/^URL: /)

describe('SujetPage — parcours 9.4', () => {
  it('rend l’en-tête, les phares et le miroir du sujet', () => {
    renduSujet('/sujet/desarmement')
    expect(screen.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    expect(screen.getByText(/coupes de presse · .+ prises de parole au registre/)).toBeVisible()
    expect(screen.getByText(/conférence de Genoves/)).toBeVisible() // description en paragraphes
    expect(screen.getByRole('link', { name: '← Retour à l’accueil' })).toHaveAttribute('href', '/')
    // Les deux phares du sujet (cp-003 presse, pd-026 parlement) et le miroir en regard.
    expect(screen.getByRole('heading', { level: 2, name: 'Extraits phares' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Miroir du sujet' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Dans la presse' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Au parlement' })).toBeVisible()
    // Gédéon Pujol parle dans le miroir ET dans la liste : au moins une carte le nomme.
    expect(screen.getAllByText('Gédéon Pujol — Chambre').length).toBeGreaterThan(0)
  })

  it('les deux graphiques peignent le trimestre filtré (bar mensuel rendu)', () => {
    renduSujet('/sujet/desarmement')
    expect(screen.getByRole('heading', { level: 2, name: 'Chronologie du trimestre' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Rythme mensuel' })).toBeVisible()
    expect(screen.getByText('bar 1934-01')).toBeVisible()
  })

  it('clic sur un point de la frise : l’URL pose ?doc= et la carte est ciblée', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement')
    await user.click(screen.getByRole('button', { name: 'cp-003 1934-01-13 Presse' }))
    expect(urlCourante().textContent).toContain('doc=cp-003')
    expect(screen.getByRole('button', { name: 'masquer le ciblage' })).toBeVisible()
  })

  it('lien profond ?doc= : la carte visée est ancrée et ciblée dès l’arrivée (rechargement)', () => {
    renduSujet('/sujet/desarmement?doc=cp-003')
    expect(screen.getByRole('button', { name: 'masquer le ciblage' })).toBeVisible()
    expect(document.getElementById('document-cp-003')).not.toBeNull()
  })

  it('« voir le détail » de la liste pose ?doc=, « masquer » le retire', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement')
    await user.click(screen.getAllByRole('button', { name: 'voir le détail' })[0]!)
    expect(urlCourante().textContent).toMatch(/doc=(?:pd|cp)-\d{3}/)
    await user.click(screen.getByRole('button', { name: 'masquer le ciblage' }))
    expect(urlCourante().textContent).not.toContain('doc=')
  })

  it('rechargement : type + orateur + fenêtre relus de l’URL préservent l’état', async () => {
    renduSujet('/sujet/desarmement?type=parlement&orateur=Aur%C3%A9lien+Duscher&du=1934-02-01')
    expect(screen.getByRole('button', { name: 'Parlement' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('checkbox', { name: 'Aurélien Duscher' })).toBeChecked()
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    expect(liste).not.toHaveTextContent(/Coupe de presse/)
    expect(liste).toHaveTextContent(/Prise de parole/)
  })

  it('segmented « Presse » : l’URL porte type=presse et la liste ne montre plus que des coupes', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement')
    await user.click(screen.getByRole('button', { name: 'Presse' }))
    expect(urlCourante().textContent).toContain('type=presse')
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    expect(liste).not.toHaveTextContent(/Prise de parole/)
    expect(liste).toHaveTextContent(/Coupe de presse/)
  })

  it('réinitialiser nettoie les filtres secondaires sans perdre l’ancre ?doc=', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement?type=presse&orateur=Aur%C3%A9lien+Duscher&du=1934-02-01&doc=cp-003')
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }))
    const url = urlCourante().textContent ?? ''
    expect(url).not.toContain('type=')
    expect(url).not.toContain('orateur=')
    expect(url).not.toContain('du=')
    expect(url).toContain('doc=cp-003')
  })

  it('filtres contradictoires : message explicite, liste vide assumée', () => {
    renduSujet('/sujet/desarmement?type=presse&orateur=Aur%C3%A9lien+Duscher')
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    expect(liste).toHaveTextContent('Aucun document ne correspond aux filtres actifs.')
  })

  it('le menu « Orateurs » est alimenté par les locuteurs réels du corpus', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement')
    await user.click(
      // Le mot « Orateurs » vit aussi dans la légende du fieldset : on cible le <summary>.
      screen.getByText(
        (_content, element) => element?.tagName === 'SUMMARY' && element.textContent === 'Orateurs',
      ),
    ) // : ouvre le panneau au clavier
    expect(screen.getByRole('checkbox', { name: 'Aurélien Duscher' })).toBeVisible()
    await user.click(
      screen.getByText(
        (_content, element) => element?.tagName === 'SUMMARY' && element.textContent === 'Journaux',
      ),
    )
    expect(screen.getByRole('checkbox', { name: 'Le Torchon lorrain' })).toBeVisible()
  })

  it('affiche un 404 honnête pour un identifiant inconnu', () => {
    renduSujet('/sujet/sujet-inexistant')
    expect(screen.getByRole('heading', { level: 1, name: 'Sujet introuvable' })).toBeVisible()
    expect(screen.getByText(/sujet-inexistant/)).toBeVisible()
    expect(screen.getByRole('link', { name: '← Retour à l’accueil' })).toHaveAttribute('href', '/')
  })
})
