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

  test('une carte vitrine mène à la page sujet provisoire', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'La crise du désarmement' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    await expect(page.getByText(/Suite du parcours à l’étape 9\.4/)).toBeVisible()
  })
})
