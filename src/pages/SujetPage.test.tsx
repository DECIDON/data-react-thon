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

/**
 * Sujet d'épreuve : les exports (presse et débats) ne classent que des sujets guides/libres,
 * les 6 sujets rédactionnels — dont « desarmement » — n'ont plus aucun document au registre.
 * Les tests qui ont besoin de documents rendent donc « agriculture » (6 526 coupes, 514 prises).
 */
const SUJET = 'agriculture'
/** Orateur retenu pour les tests de filtre : deux prises au 8 février 1934 (chambre). */
const ORATEUR = 'Briquet'
const AU_8_FEVRIER = 'du=1934-02-08&au=1934-02-08'

describe('SujetPage — parcours 9.4', () => {
  it('rend l’en-tête, les phares et le miroir du sujet', () => {
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
    expect(screen.getByRole('heading', { level: 1, name: 'La détresse des campagnes' })).toBeVisible()
    expect(screen.getByText(/coupes de presse · .+ prises de parole au registre/)).toBeVisible()
    expect(screen.getByText(/cours des céréales/)).toBeVisible() // description en paragraphes
    expect(screen.getByRole('link', { name: '← Retour à l’accueil' })).toHaveAttribute('href', '/')
    // TODO(corpus) : les exports ne portent pas de `highlight` — la section « Extraits phares »
    // est vide partout, et c'est justement ce qu'on verrouille ici (elle revient avec la curation).
    expect(screen.queryByRole('heading', { level: 2, name: 'Extraits phares' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Miroir du sujet' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Dans la presse' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Au parlement' })).toBeVisible()
    // Le miroir ET la liste nomment leurs locuteurs : au moins une carte porte le sien.
    expect(screen.getAllByText(/ — (Chambre|Sénat)/).length).toBeGreaterThan(0)
  })

  it('les deux graphiques peignent le trimestre filtré (bar mensuel rendu)', () => {
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
    expect(screen.getByRole('heading', { level: 2, name: 'Chronologie du trimestre' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'Rythme mensuel' })).toBeVisible()
    // Fenêtré au 8 février : la seule colonne peinte est donc celle de février.
    expect(screen.getByText('bar 1934-02')).toBeVisible()
  })

  it('la frise peint une bande par couple couloir × polarité présent dans le trimestre filtré', () => {
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
    expect(screen.getByRole('heading', { level: 2, name: 'Chronologie du trimestre' })).toBeVisible()
    // Une bande agrège des documents : le mock peint l'id de série, pas l'id de document.
    expect(screen.getAllByText(/^bande (presse|parlement):(positif|neutre|negatif)$/).length).toBeGreaterThan(
      0,
    )
  })

  it('le segmented d’échelle pose ?frise=parts (les défauts ne polluent pas l’URL)', async () => {
    const user = userEvent.setup()
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
    expect(screen.getByRole('button', { name: 'Effectifs absolus' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Parts relatives' }))
    expect(urlCourante().textContent).toContain('frise=parts')
    expect(screen.getByRole('button', { name: 'Parts relatives' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Effectifs absolus' }))
    expect(urlCourante().textContent).not.toContain('frise')
  })

  it('lien profond ?frise=parts : le segmented est pressé dès l’arrivée', () => {
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}&frise=parts`)
    expect(screen.getByRole('button', { name: 'Parts relatives' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Effectifs absolus' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('lien profond ?doc= : la carte visée est ancrée et ciblée dès l’arrivée (rechargement)', () => {
    // Sujet servi par l'export presse, fenêtres sur sa seule journée présente au corpus.
    renduSujet('/sujet/libre-2?du=1934-02-12&au=1934-02-12&doc=cp-30619')
    expect(screen.getByRole('button', { name: 'masquer le ciblage' })).toBeVisible()
    expect(document.getElementById('document-cp-30619')).not.toBeNull()
  })

  it('« voir le détail » de la liste pose ?doc=, « masquer » le retire', async () => {
    const user = userEvent.setup()
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
    // Le miroir a ses propres boutons « voir le détail » : on cible bien ceux de la liste.
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    await user.click(within(liste).getAllByRole('button', { name: 'voir le détail' })[0]!)
    expect(urlCourante().textContent).toMatch(/doc=(?:pd|cp)-\d{3}/)
    await user.click(screen.getByRole('button', { name: 'masquer le ciblage' }))
    expect(urlCourante().textContent).not.toContain('doc=')
  })

  it('rechargement : type + orateur + fenêtre relus de l’URL préservent l’état', async () => {
    renduSujet(`/sujet/${SUJET}?type=parlement&orateur=${ORATEUR}&${AU_8_FEVRIER}`)
    expect(screen.getByRole('button', { name: 'Parlement' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('checkbox', { name: ORATEUR })).toBeChecked()
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    expect(liste).not.toHaveTextContent(/Coupe de presse/)
    expect(liste).toHaveTextContent(/Prise de parole/)
    // Le badge de chambre du locuteur retenu (les deux prises du jour sont à la Chambre).
    expect(screen.getByRole('list', { name: 'Locuteurs retenus et leurs chambres' })).toHaveTextContent(
      'Briquet — Chambre',
    )
  })

  it('segmented « Presse » : l’URL porte type=presse et la liste ne montre plus que des coupes', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/libre-2?du=1934-02-12&au=1934-02-12')
    await user.click(screen.getByRole('button', { name: 'Presse' }))
    expect(urlCourante().textContent).toContain('type=presse')
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    expect(liste).not.toHaveTextContent(/Prise de parole/)
    expect(liste).toHaveTextContent(/Coupe de presse/)
  })

  it('réinitialiser nettoie les filtres secondaires sans perdre l’ancre ?doc=', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/libre-2?type=presse&journal=JDPL&du=1934-02-12&au=1934-02-12&doc=cp-30619')
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }))
    const url = urlCourante().textContent ?? ''
    expect(url).not.toContain('type=')
    expect(url).not.toContain('journal=')
    expect(url).not.toContain('du=')
    expect(url).toContain('doc=cp-30619')
  })

  it('filtres contradictoires : message explicite, liste vide assumée', () => {
    // Presse + orateur : une coupe n'a pas de locuteur, rien à afficher.
    renduSujet(`/sujet/${SUJET}?type=presse&orateur=${ORATEUR}`)
    const liste = screen.getByRole('region', { name: /Liste chronologique/ })
    expect(liste).toHaveTextContent('Aucun document ne correspond aux filtres actifs.')
  })

  it('le menu « Locuteurs » est alimenté par les locuteurs réels du corpus', async () => {
    const user = userEvent.setup()
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
    await user.click(
      // Le mot « Locuteurs » vit aussi dans la légende du fieldset : on cible le <summary>.
      screen.getByText(
        (_content, element) => element?.tagName === 'SUMMARY' && element.textContent === 'Locuteurs',
      ),
    ) // : ouvre le panneau au clavier
    // Le menu est peuplé par les locuteurs du corpus : 1 109 noms pour 7 038 prises de parole.
    expect(screen.getByRole('checkbox', { name: ORATEUR })).toBeVisible()
    await user.click(
      screen.getByText(
        (_content, element) => element?.tagName === 'SUMMARY' && element.textContent === 'Journaux',
      ),
    )
    expect(screen.getByRole('checkbox', { name: 'La Dépêche de Toulouse' })).toBeVisible()
  })

  it('affiche un 404 honnête pour un identifiant inconnu', () => {
    renduSujet('/sujet/sujet-inexistant')
    expect(screen.getByRole('heading', { level: 1, name: 'Sujet introuvable' })).toBeVisible()
    expect(screen.getByText(/sujet-inexistant/)).toBeVisible()
    expect(screen.getByRole('link', { name: '← Retour à l’accueil' })).toHaveAttribute('href', '/')
  })
})

describe('SujetPage — détail d’un document en modale (9.5)', () => {
  it('lien profond ?doc= : la modale s’ouvre dès l’arrivée, extrait intégral et source', () => {
    renduSujet('/sujet/libre-2?du=1934-02-12&au=1934-02-12&doc=cp-30619')
    const dialogue = screen.getByRole('dialog', { name: 'Coupe de presse' })
    expect(dialogue).toHaveAttribute('open')
    // Extrait intégral : la fin de phrase, coupée par la troncature de la liste, est bien là.
    expect(within(dialogue).getByText(/aussi satisfaisant que possible/)).toBeVisible()
    expect(dialogue.textContent).not.toMatch(/…\s*$/)
    // L'export presse ne porte pas d'archive adressable : la source est un texte, pas un lien.
    expect(within(dialogue).getByText('JDPL — édition du 12 février 1934')).toBeVisible()
    expect(within(dialogue).queryByRole('link')).toBeNull()
    // La 9.4 reste : la carte visée est toujours ancrée derrière la modale.
    expect(document.getElementById('document-cp-30619')).not.toBeNull()
  })

  // TODO(corpus) : les exports (presse comme débats) ne rattachent qu'UN sujet par document.
  // Le comportement « toutes les puces » reste couvert sur fixtures par `DocumentDetail.test.tsx`;
  // ce test de page n'a plus, dans le corpus réel, de document multi-sujets à ouvrir.
  it.skip('la modale porte les puces de TOUS les sujets du document, pas seulement celui de la page', () => {
    renduSujet('/sujet/desarmement?doc=pd-008')
    const dialogue = screen.getByRole('dialog', { name: 'Prise de parole' })
    const puces = within(dialogue).getByRole('list', { name: 'Polarités par sujet' })
    expect(puces).toHaveTextContent('La crise du désarmement · positif')
    expect(puces).toHaveTextContent('Le budget et les décrets-lois · neutre')
  })

  it('bouton « Fermer » : la modale se ferme et ?doc= disparaît de l’URL', async () => {
    const user = userEvent.setup()
    renduSujet('/sujet/libre-2?du=1934-02-12&au=1934-02-12&doc=cp-30619')
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(urlCourante().textContent).not.toContain('doc=')
  })

  it('ouverture depuis la liste, fermeture Échap : URL propre et focus rendu au déclencheur', async () => {
    const user = userEvent.setup()
    renduSujet(`/sujet/${SUJET}?${AU_8_FEVRIER}`)
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
    renduSujet('/sujet/libre-2?du=1934-02-12&au=1934-02-12&doc=cp-30619')
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
    expect(within(dialogue).getAllByRole('option')).toHaveLength(13)
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
