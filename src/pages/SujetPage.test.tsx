import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SujetPage } from './SujetPage'

/**
 * Mouture provisoire de la page sujet (étape 9.3) : en-tête honnête et compteurs —
 * l'écran sera remplacé en 9.4, ce test veille sur les libellés qui engagent l'app.
 */
function renduSujet(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/sujet/${id}`]}>
      <Routes>
        <Route path="/sujet/:id" element={<SujetPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SujetPage — étape 9.3', () => {
  it('rend le libellé, la description et les compteurs du sujet', () => {
    renduSujet('desarmement')
    expect(screen.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    expect(screen.getByText(/coupes de presse · .+ prises de parole au registre/)).toBeVisible()
    expect(screen.getByText(/conférence de Genoves/)).toBeVisible() // description rendue en paragraphes
    expect(screen.getByText(/Suite du parcours à l’étape 9\.4/)).toBeVisible()
    expect(screen.getByRole('link', { name: '← Retour à l’accueil' })).toHaveAttribute('href', '/')
  })

  it('affiche un 404 honnête pour un identifiant inconnu', () => {
    renduSujet('sujet-inexistant')
    expect(screen.getByRole('heading', { level: 1, name: 'Sujet introuvable' })).toBeVisible()
    expect(screen.getByText(/sujet-inexistant/)).toBeVisible()
    expect(screen.getByRole('link', { name: '← Retour à l’accueil' })).toHaveAttribute('href', '/')
  })
})
