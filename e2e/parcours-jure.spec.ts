import { expect, test } from '@playwright/test'

/**
 * Parcours juré de bout en bout (étape 9.6, spec §1 et §6) : un juré qui ne connaît rien
 * à l'application part de l'accueil, choisit un sujet en vitrine, lit le miroir, ouvre le
 * détail intégral d'une prise de parole, pose un filtre, recharge — et retrouve son écran.
 * La fumée (`smoke.spec.ts`) vérifie que l'app est vivante ; ce fichier verrouille le
 * parcours complet, en libellés réels français et sans sélecteur de test (C-006), contre
 * le build de production servi par le webServer du harnais.
 */
test.describe('parcours juré (R9.6)', () => {
  test.beforeEach(async ({ page }) => {
    // Règle du projet source : AUCUN réseau externe — tout ce qui n'est pas localhost est abandonné.
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith('http://localhost:4173')) {
        return route.continue()
      }
      return route.abort()
    })
  })

  test('accueil → vitrine → miroir → détail intégral → filtre → rechargement', async ({ page }) => {
    // 1. Sans rien connaître, le juré découvre l'accueil : calendrier du trimestre et vitrine.
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Presse & palabre' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Le trimestre en un coup d’œil' })).toBeVisible()
    await expect(page.locator('svg').first()).toBeVisible() // le calendrier Nivo est peint
    await expect(page.getByRole('heading', { level: 2, name: 'Sujets en vitrine' })).toBeVisible()

    // 2. Il suit la carte vitrine que l'accueil lui propose : cap sur le sujet.
    await page.getByRole('link', { name: 'La crise du désarmement' }).click()
    await expect(page).toHaveURL(/\/sujet\/desarmement/)
    await expect(page.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Extraits phares' })).toBeVisible()

    // 3. Le MIROIR : les deux moitiés en regard, chacune avec son badge de polarité.
    const miroir = page.getByRole('region', { name: 'Miroir du sujet' })
    await expect(miroir.getByRole('heading', { level: 3, name: 'Dans la presse' })).toBeVisible()
    await expect(miroir.getByRole('heading', { level: 3, name: 'Au parlement' })).toBeVisible()
    await expect(miroir.getByText('La crise du désarmement · positif')).toBeVisible()
    await expect(miroir.getByText('La crise du désarmement · négatif')).toBeVisible()
    // Raccord 9.6 : le miroir aussi mène au détail — on ouvre la première carte proposée,
    // en fermant au clavier. (Sujet « désarmement » : la presse n'y est pas encore rattachée
    // par la classification de l'export, c'est donc le volet parlement qui mène.)
    await miroir.getByRole('button', { name: 'voir le détail' }).first().click()
    await expect(page.getByRole('dialog', { name: 'Prise de parole' })).toBeVisible()
    await expect(page).toHaveURL(/doc=pd-\d{3}/)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).not.toHaveURL(/doc=/)

    // 4. Une prise de parole cliquée dans la liste ouvre l'extrait INTÉGRAL en modale :
    //    la carte derrière est tronquée (…), la modale porte la fin de phrase complète.
    const carte = page.locator('#document-pd-037')
    await expect(carte.getByText(/…$/)).toBeVisible() // version liste : tronquée.
    await carte.getByRole('button', { name: 'voir le détail' }).click()
    const dialogue = page.getByRole('dialog', { name: 'Prise de parole' })
    await expect(dialogue).toBeVisible()
    await expect(page).toHaveURL(/doc=pd-037/)
    await expect(dialogue).toContainText('Camille Rouveur — Chambre')
    await expect(dialogue).toContainText('(Applaudissements à gauche.)') // la fin, absente de la carte
    // Il referme : plus de modale, URL propre, la liste est toujours là.
    await dialogue.getByRole('button', { name: 'Fermer' }).click()
    await expect(dialogue).toBeHidden()
    await expect(page).not.toHaveURL(/doc=/)

    // 5. Le juré pose un filtre : un seul locuteur retenu, et la liste comme l'URL suivent.
    const locuteurs = page.locator('summary', { hasText: 'Locuteurs' })
    await locuteurs.click()
    const pujol = page.getByRole('checkbox', { name: 'Gédéon Pujol' })
    // Clic simple, puis assertions qui patientent : la réécriture de l'URL passe par une
    // transition React Router et l'input est contrôlé — l'état stable est vérifié, pas supposé.
    await pujol.click()
    await expect(pujol).toBeChecked()
    await expect(page).toHaveURL(/orateur=G%C3%A9d%C3%A9on\+Pujol/)
    const liste = page.getByRole('region', { name: 'Liste chronologique' })
    await expect(liste.getByText('Coupe de presse')).toHaveCount(0) // plus aucune presse
    await expect(liste.getByText('Prise de parole')).toHaveCount(3) // ses 3 prises du trimestre

    // 6. Rechargement : l'URL est l'état — le même écran revient, filtre compris.
    await page.reload()
    await expect(page).toHaveURL(/orateur=G%C3%A9d%C3%A9on\+Pujol/)
    await expect(page.getByRole('heading', { level: 1, name: 'La crise du désarmement' })).toBeVisible()
    await locuteurs.click()
    await expect(page.getByRole('checkbox', { name: 'Gédéon Pujol' })).toBeChecked()
    await expect(liste.getByText('Coupe de presse')).toHaveCount(0)
    await expect(liste.getByText('Prise de parole')).toHaveCount(3)

    // 7. Et toujours, au bas de l'écran où qu'il en soit : le bandeau d'honnêteté.
    await expect(page.getByText('Prototype — données fictives')).toBeVisible()
  })
})
