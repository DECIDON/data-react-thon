import { expect, test } from '@playwright/test'

/**
 * Fumée (BOOTSTRAP-CHECKLIST 17) : ouvrir l'app et la voir vivante, jusqu'au premier
 * lien vivant du parcours juré (accueil → page sujet).
 * Règle du projet source : AUCUN réseau externe — tout ce qui n'est pas localhost est abandonné.
 * Libellés réels, zéro sélecteur de test (C-006) ; le parcours complet attend l'étape 9.6.
 */
test.describe('fumée', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith('http://localhost:4173')) {
        return route.continue()
      }
      return route.abort()
    })
  })

  test('l’accueil rend le calendrier et la vitrine des sujets', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Presse & palabre' })).toBeVisible()
    // Le calendrier Nivo peint son SVG (rôle « img » posé par le paquet).
    await expect(page.locator('svg').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'La crise du désarmement' })).toBeVisible()
    await expect(page.getByText('Prototype — données fictives')).toBeVisible()
  })

  test('une carte vitrine mène à la page sujet : phares, miroir et filtres rendus', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'La crise du désarmement' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Extraits phares' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Miroir du sujet' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Parlement' })).toBeVisible()
  })

  test('parcours juré 9.4 : filtres en URL puis ancrage du détail', async ({ page }) => {
    await page.goto('/sujet/desarmement')
    // Filtre « Parlement » : l'URL porte le filtre, la liste suit (spec §4).
    await page.getByRole('button', { name: 'Parlement' }).click()
    await expect(page).toHaveURL(/type=parlement/)
    const liste = page.getByRole('region', { name: 'Liste chronologique' })
    await expect(liste.getByText('Coupe de presse')).toHaveCount(0)
    // Le premier document filtré s'ancre en détail via ?doc=.
    await liste.getByRole('button', { name: 'voir le détail' }).first().click()
    await expect(page).toHaveURL(/doc=(?:pd|cp)-\d{3}/)
    await expect(liste.getByRole('button', { name: 'masquer le ciblage' })).toBeVisible()
    // Le rechargement restore l'état (les filtres survivent à l'URL).
    await page.reload()
    await expect(page.getByRole('button', { name: 'Parlement' })).toHaveAttribute('aria-pressed', 'true')
    await expect(liste.getByRole('button', { name: 'masquer le ciblage' })).toBeVisible()
  })
})
