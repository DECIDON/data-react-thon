import { expect, test } from '@playwright/test'

/**
 * Fumée (BOOTSTRAP-CHECKLIST 17) : ouvrir l'app et la voir vivante.
 * Règle du projet source : AUCUN réseau externe — tout ce qui n'est pas localhost est abandonné,
 * l'indexation IndexedDB est vierge par contexte (Playwright garantit un contexte frais).
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

  test('la page d’accueil affiche Hello World', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Hello World' })).toBeVisible()
  })
})
