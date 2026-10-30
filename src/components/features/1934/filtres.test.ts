import type { Document1934 } from '@/domain/1934'
import { describe, expect, it } from 'vitest'
import {
  appliquerFiltres,
  filtrer,
  filtresParDefaut,
  lireFiltresDepuisURL,
  nomDuJournal,
  type ListesDeFiltres,
} from './filtres'

/**
 * Contrat des filtres de la page sujet (spec §4) : lecture tolérante de l'URL, écriture
 * sans pollution des défauts, filtrage en ET. Fixtures minimales conformes au contrat.
 */

const listes: ListesDeFiltres = {
  locuteurs: ['Aurélien Duscher', 'Camille Rouveur'],
  journaux: ['Le Torchon lorrain', 'La Croix audoise'],
}

const priseDuscher: Document1934 = {
  id: 'pd-001',
  date: '1934-01-03',
  source: { title: 'Compte rendu de la séance de la Chambre du 3 janvier 1934', url: null },
  content: 'Une intervention.',
  speaker: { name: 'Aurélien Duscher', chamber: 'chambre' },
  subjects: [{ topicId: 'desarmement', polarity: 'positif' }],
}
const priseRouveur: Document1934 = {
  id: 'pd-002',
  date: '1934-02-05',
  source: { title: 'Compte rendu de la séance du Sénat du 5 février 1934', url: null },
  content: 'Une autre intervention.',
  speaker: { name: 'Camille Rouveur', chamber: 'senat' },
  subjects: [{ topicId: 'desarmement', polarity: 'negatif' }],
}
const coupeTorchon: Document1934 = {
  id: 'cp-001',
  date: '1934-01-13',
  source: { title: 'Le Torchon lorrain — édition du 13 janvier 1934', url: 'https://exemple.invalid' },
  content: 'Un entrefilet.',
  subjects: [{ topicId: 'desarmement', polarity: 'negatif' }],
}
const coupeCroix: Document1934 = {
  id: 'cp-002',
  date: '1934-03-09',
  source: { title: 'La Croix audoise — édition du 9 mars 1934', url: null },
  content: 'Un autre entrefilet.',
  subjects: [{ topicId: 'desarmement', polarity: 'neutre' }],
}
const lot: Document1934[] = [priseDuscher, priseRouveur, coupeTorchon, coupeCroix]

describe('lireFiltresDepuisURL — validation tolérante', () => {
  it('URL vide ⇒ valeurs par défaut du tableau de spec (§4)', () => {
    expect(lireFiltresDepuisURL(new URLSearchParams(''), listes)).toEqual({
      type: 'tout',
      orateurs: [],
      journaux: [],
      du: '1934-01-01',
      au: '1934-03-31',
      doc: null,
    })
  })

  it('URL trafiquée : tout est ignoré, rien ne crash', () => {
    const trafiquee = new URLSearchParams(
      'type=banane&orateur=Napol%C3%A9on&orateur=&journal=Miroir+du+canard&du=1870-05-03&au=31&doc=<script>',
    )
    expect(lireFiltresDepuisURL(trafiquee, listes)).toEqual(filtresParDefaut())
  })

  it('paramètres valides lus tels quels, multi répétés dédoublonnés et triés', () => {
    const params = new URLSearchParams(
      'type=parlement&orateur=Camille+Rouveur&orateur=Aur%C3%A9lien+Duscher&orateur=Camille+Rouveur&du=1934-02-01&doc=cp-003',
    )
    expect(lireFiltresDepuisURL(params, listes)).toEqual({
      type: 'parlement',
      orateurs: ['Aurélien Duscher', 'Camille Rouveur'],
      journaux: [],
      du: '1934-02-01',
      au: '1934-03-31',
      doc: 'cp-003',
    })
  })

  it('fenêtre trafiquée (du > au) : les deux bornes retombent aux défauts', () => {
    const filtres = lireFiltresDepuisURL(new URLSearchParams('du=1934-03-01&au=1934-01-15'), listes)
    expect(filtres.du).toBe('1934-01-01')
    expect(filtres.au).toBe('1934-03-31')
  })

  it('sans listes de corpus, les noms inconnus restent (rien à confronter)', () => {
    const filtres = lireFiltresDepuisURL(new URLSearchParams('orateur=Prosper+Bavouze'))
    expect(filtres.orateurs).toEqual(['Prosper Bavouze'])
  })
})

describe('appliquerFiltres — écriture sans pollution', () => {
  it('les défauts ne polluent jamais l’URL', () => {
    expect(appliquerFiltres(new URLSearchParams(), filtresParDefaut()).toString()).toBe('')
  })

  it('seuls les non-défauts sont écrits, dans un ordre stable', () => {
    const params = appliquerFiltres(new URLSearchParams('jour=1934-02-02'), {
      type: 'parlement',
      orateurs: ['Camille Rouveur', 'Aurélien Duscher'],
      journaux: ['La Croix audoise'],
      du: '1934-01-01',
      au: '1934-02-28',
      doc: 'pd-002',
    })
    expect(params.toString()).toBe(
      'jour=1934-02-02&type=parlement&orateur=Aur%C3%A9lien+Duscher&orateur=Camille+Rouveur&journal=La+Croix+audoise&au=1934-02-28&doc=pd-002',
    )
  })

  it('relire ce qui vient d’être écrit rend le même état (aller-retour)', () => {
    const filtres = {
      type: 'presse' as const,
      orateurs: ['Aurélien Duscher'],
      journaux: ['Le Torchon lorrain'],
      du: '1934-01-10',
      au: '1934-03-31',
      doc: 'cp-001' as string | null,
    }
    expect(lireFiltresDepuisURL(appliquerFiltres(new URLSearchParams(), filtres), listes)).toEqual(filtres)
  })

  it('réécrire les filtres remplace les anciennes valeurs (pas d’accumulation)', () => {
    const premieres = appliquerFiltres(new URLSearchParams(), {
      ...filtresParDefaut(),
      orateurs: ['Aurélien Duscher', 'Camille Rouveur'],
    })
    const suivantes = appliquerFiltres(premieres, { ...filtresParDefaut(), orateurs: ['Camille Rouveur'] })
    expect(suivantes.getAll('orateur')).toEqual(['Camille Rouveur'])
  })
})

describe('filtrer — combinaison des facettes en ET', () => {
  it('aucun filtre actif : tout passe, ordre conservé', () => {
    expect(filtrer(lot, filtresParDefaut())).toEqual(lot)
  })

  it('type presse : les coupes seules ; type parlement : les prises seules', () => {
    expect(filtrer(lot, { ...filtresParDefaut(), type: 'presse' })).toEqual([coupeTorchon, coupeCroix])
    expect(filtrer(lot, { ...filtresParDefaut(), type: 'parlement' })).toEqual([priseDuscher, priseRouveur])
  })

  it('orateur : sélection multiple par speaker.name', () => {
    expect(filtrer(lot, { ...filtresParDefaut(), orateurs: ['Camille Rouveur'] })).toEqual([priseRouveur])
    expect(
      filtrer(lot, { ...filtresParDefaut(), orateurs: ['Camille Rouveur', 'Aurélien Duscher'] }),
    ).toEqual([priseDuscher, priseRouveur])
  })

  it('journal : par NOM (partie avant le tiret long), jamais par titre complet', () => {
    expect(nomDuJournal(coupeTorchon)).toBe('Le Torchon lorrain')
    expect(filtrer(lot, { ...filtresParDefaut(), journaux: ['Le Torchon lorrain'] })).toEqual([coupeTorchon])
  })

  it('fenêtre du/au bornante, inclusivement', () => {
    expect(filtrer(lot, { ...filtresParDefaut(), du: '1934-01-13', au: '1934-03-09' })).toEqual([
      priseRouveur,
      coupeTorchon,
      coupeCroix,
    ])
  })

  it('type + orateur + dates combinés : un seul document survit', () => {
    expect(
      filtrer(lot, {
        ...filtresParDefaut(),
        type: 'parlement',
        orateurs: ['Aurélien Duscher'],
        du: '1934-01-01',
        au: '1934-01-31',
      }),
    ).toEqual([priseDuscher])
  })
})
