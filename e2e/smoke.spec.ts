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
    // 9.5 : la modale de détail s'est ouverte avec l'ancre — on la referme, l'URL redevient propre.
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).not.toHaveURL(/doc=/)
  })

  test('parcours juré 9.5 : détail en modale, extrait intégral et URL partageable', async ({ page }) => {
    await page.goto('/sujet/desarmement')
    // Ouverture depuis la liste : un clic, une modale, une URL qui porte le document.
    const liste = page.getByRole('region', { name: 'Liste chronologique' })
    await liste.getByRole('button', { name: 'voir le détail' }).first().click()
    const dialogue = page.getByRole('dialog')
    await expect(dialogue).toBeVisible()
    await expect(page).toHaveURL(/doc=(?:pd|cp)-\d{3}/)
    await expect(dialogue.getByRole('button', { name: 'Fermer' })).toBeVisible()
    // Échap ferme la modale et rend l'URL propre (l'URL reste la source de vérité).
    await page.keyboard.press('Escape')
    await expect(dialogue).toBeHidden()
    await expect(page).not.toHaveURL(/doc=/)
    // URL partageable : le lien profond rouvre le bon document, extrait RENDU ENTIER
    // (la fin de phrase, coupée par la troncature de la liste, est bien présente).
    await page.goto('/sujet/desarmement?doc=cp-003')
    await expect(page.getByRole('dialog', { name: 'Coupe de presse' })).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('cent mille au pays.')
    await expect(
      page.getByRole('link', { name: 'Le Républicain picard — édition du 13 janvier 1934' }),
    ).toHaveAttribute('href', 'https://archives.example/republicain-picard/1934-01-13')
  })
})
