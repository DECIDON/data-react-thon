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

  test('une carte vitrine mène à la page sujet : miroir et filtres rendus', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'La crise du désarmement' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    // TODO(corpus) : plus aucun « Extraits phares » — les exports ne portent pas de `highlight`,
    // et les trois sujets de vitrine ne sont pas classés par l'export (0 document chacun).
    await expect(page.getByRole('heading', { level: 2, name: 'Miroir du sujet' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Parlement' })).toBeVisible()
  })

  test('parcours juré 9.4 : filtres en URL puis ancrage du détail', async ({ page }) => {
    // Sujet classé par les deux exports, fenêtré à une journée de séance (74 documents).
    await page.goto('/sujet/agriculture?du=1934-02-08&au=1934-02-08')
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
    await page.goto('/sujet/libre-2?du=1934-02-12&au=1934-02-12&doc=cp-30619')
    await expect(page.getByRole('dialog', { name: 'Coupe de presse' })).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('aussi satisfaisant que possible')
    // L'export presse ne porte pas d'archive adressable : la source est un texte, pas un lien.
    await expect(page.getByText('JDPL — édition du 12 février 1934')).toBeVisible()
  })

  test('titre cliquable : le sélecteur de sujet mène à un autre sujet', async ({ page }) => {
    await page.goto('/sujet/desarmement')
    await page.getByRole('button', { name: 'La crise du désarmement' }).click()
    const dialogue = page.getByRole('dialog', { name: 'Changer de sujet' })
    await expect(dialogue).toBeVisible()
    // La liste déroulante contient bien les six sujets du registre.
    await expect(dialogue.getByRole('option')).toHaveCount(13)
    await dialogue.getByRole('combobox').selectOption('ligues')
    await expect(dialogue).toBeHidden()
    await expect(page).toHaveURL(/\/sujet\/ligues$/)
    await expect(page.getByRole('heading', { level: 1, name: 'La menace des ligues' })).toBeVisible()
  })
})
