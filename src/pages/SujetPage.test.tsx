import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useSearchParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { SujetPage } from './SujetPage'

/**
 * Page sujet (étape 9.4), **Nivo mocké à la frontière** (C-009) : le mock bump peint une
 * ligne de texte par bande (identifiant de série) ; le mock bar peint une ligne par mois.
 * Les assertions restent sur libellés réels (C-006). Une « sonde » rend l'URL courante à
 * côté de la page : c'est l'URL qui est l'état (spec §4).
 */

vi.mock('@nivo/bump', async () => {
  const React = await import('react')
  return {
    ResponsiveAreaBump: ({ data }: { data: Array<{ id: string }> }) =>
      React.createElement(
        'div',
        null,
        data.map((serie) => React.createElement('p', { key: serie.id }, `bande ${serie.id}`)),
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

/** Témoin de la route courante : le sélecteur de sujet navigue, la sonde de chemin le prouve. */
function SondeChemin() {
  return <p>{`CHEMIN: ${useLocation().pathname}`}</p>
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

/** Même rendu, avec le témoin de chemin : pour prouver que le sélecteur a bien navigué. */
function renduAvecChemin(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Sonde />
      <SondeChemin />
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

  it('la frise peint une bande par couple couloir × polarité présent dans le trimestre filtré', () => {
    renduSujet('/sujet/desarmement')
    expect(screen.getByRole('heading', { level: 2, name: 'Chronologie du trimestre' })).toBeVisible()
    // Une bande agrège des documents : le mock peint l'id de série, pas l'id de document.
    expect(screen.getAllByText(/^bande (presse|parlement):(positif|neutre|negatif)$/).length).toBeGreaterThan(
      0,
    )
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

  it('le menu « Locuteurs » est alimenté par les locuteurs réels du corpus', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement')
    await user.click(
      // Le mot « Locuteurs » vit aussi dans la légende du fieldset : on cible le <summary>.
      screen.getByText(
        (_content, element) => element?.tagName === 'SUMMARY' && element.textContent === 'Locuteurs',
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

describe('SujetPage — détail d’un document en modale (9.5)', () => {
  it('lien profond ?doc= : la modale s’ouvre dès l’arrivée, extrait intégral et source liée', () => {
    renduSujet('/sujet/desarmement?doc=cp-003')
    const dialogue = screen.getByRole('dialog', { name: 'Coupe de presse' })
    expect(dialogue).toHaveAttribute('open')
    // Extrait intégral (la carte du fond, elle, est tronquée) + lien vers l'archive fictive.
    expect(within(dialogue).getByText(/cent mille au pays\./)).toBeVisible()
    expect(dialogue.textContent).not.toMatch(/…\s*$/)
    expect(
      within(dialogue).getByRole('link', { name: 'Le Républicain picard — édition du 13 janvier 1934' }),
    ).toHaveAttribute('href', 'https://archives.example/republicain-picard/1934-01-13')
    // La 9.4 reste : la carte visée est toujours ancrée derrière la modale.
    expect(document.getElementById('document-cp-003')).not.toBeNull()
  })

  it('la modale porte les puces de TOUS les sujets du document, pas seulement celui de la page', () => {
    renduSujet('/sujet/desarmement?doc=pd-008')
    const dialogue = screen.getByRole('dialog', { name: 'Prise de parole' })
    const puces = within(dialogue).getByRole('list', { name: 'Polarités par sujet' })
    expect(puces).toHaveTextContent('La crise du désarmement · positif')
    expect(puces).toHaveTextContent('Le budget et les décrets-lois · neutre')
  })

  it('bouton « Fermer » : la modale se ferme et ?doc= disparaît de l’URL', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement?doc=cp-003')
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(urlCourante().textContent).not.toContain('doc=')
  })

  it('ouverture depuis la liste, fermeture Échap : URL propre et focus rendu au déclencheur', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement')
    await user.click(screen.getAllByRole('button', { name: 'voir le détail' })[0]!)
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fermer' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(urlCourante().textContent).not.toContain('doc=')
    // Focus piégé puis rendu : le bouton qui a ouvert la modale le récupère.
    expect(document.activeElement).toHaveAccessibleName('voir le détail')
  })

  it('clic sur le fond de la modale : fermeture et URL nettoyée', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/desarmement?doc=cp-003')
    await user.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(urlCourante().textContent).not.toContain('doc=')
  })

  it('?doc= inconnu du corpus : URL nettoyée, message discret, aucun crash', () => {
    renduSujet('/sujet/desarmement?doc=cp-999')
    expect(screen.getByRole('status')).toHaveTextContent('cp-999')
    expect(urlCourante().textContent).not.toContain('doc=')
    expect(screen.queryByRole('dialog')).toBeNull()
    // La page est vivante derrière : rien n'a crashé.
    expect(screen.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
  })

  it('?doc= mal formé : même traitement (nettoyé + tracé), jamais d’indifférence silencieuse', () => {
    renduSujet('/sujet/desarmement?doc=patraque')
    expect(screen.getByRole('status')).toHaveTextContent('patraque')
    expect(urlCourante().textContent).not.toContain('doc=')
  })
})

describe('SujetPage — sélecteur de sujet depuis le titre', () => {
  it('le titre cliquable ouvre le sélecteur : choisir un sujet affiche sa page', async () => {
    const user = userEvent.setup()
    renduAvecChemin('/sujet/desarmement')
    await user.click(screen.getByRole('button', { name: 'La crise du désarmement' }))
    const dialogue = screen.getByRole('dialog', { name: 'Changer de sujet' })
    // La liste déroulante propose TOUS les sujets du registre, celui de l'écran en tête.
    const liste = within(dialogue).getByRole('combobox', { name: 'Tous les sujets du registre' })
    expect(liste).toHaveValue('desarmement')
    expect(within(dialogue).getAllByRole('option')).toHaveLength(6)
    await user.selectOptions(liste, 'ligues')
    // C'est désormais le sujet sélectionné qui est affiché, pop-up refermée, filtres repris à zéro.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'La menace des ligues' })).toBeVisible()
    expect(screen.getByText('CHEMIN: /sujet/ligues')).toBeInTheDocument()
    expect(urlCourante().textContent).toBe('URL: (vide)')
  })

  it('Échap sur le sélecteur : la pop-up se referme sans changer de sujet', async () => {
    const user = userEvent.setup()
    renduAvecChemin('/sujet/desarmement')
    await user.click(screen.getByRole('button', { name: 'La crise du désarmement' }))
    expect(screen.getByRole('dialog', { name: 'Changer de sujet' })).toHaveAttribute('open')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'La crise du désarmement' }))
  })

  it('bouton « Fermer » du sélecteur : fermeture sans navigation', async () => {
    const user = userEvent.setup()
    renduAvecChemin('/sujet/desarmement')
    await user.click(screen.getByRole('button', { name: 'La crise du désarmement' }))
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('CHEMIN: /sujet/desarmement')).toBeInTheDocument()
  })
})
