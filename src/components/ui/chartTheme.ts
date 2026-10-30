import type { Polarite } from '@/domain/1934'
import type { PartialTheme } from '@nivo/theming'

/**
 * Palette de polarité commune aux puces (9.3) et aux graphiques (9.4) : rouge / gris /
 * vert, dans les teintes pleines des palette Tailwind correspondantes (red-600,
 * neutral-400, emerald-600). Les classes CSS des puces vivent dans `CarteDocument` ;
 * ici les hex, seuls utilisables au niveau SVG.
 */
export const COULEURS_POLARITE: Record<Polarite, string> = {
  positif: '#059669', // emerald-600
  neutre: '#a3a3a3', // neutral-400
  negatif: '#dc2626', // red-600
}

/**
 * Palette ordinaire des sujets (diagramme de répartition du panneau du jour) : teintes
 * pleines `-500` de Tailwind, appariées par rang au `sujets` du corpus — un sujet garde
 * donc la même couleur d'un jour à l'autre. Au-delà de la palette, on recycle (moyennant
 * 6 à 8 sujets au registre, la chance de collision visuelle est faible).
 */
export const COULEURS_SUJETS: readonly string[] = [
  '#0ea5e9', // sky-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
  '#f43f5e', // rose-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#14b8a6', // teal-500
]

/**
 * Thème clair commun de tous les graphiques Nivo (spec §5, ADR C-009) : un seul objet,
 * aligné sur la palette Tailwind de l'app (fond `neutral-50`, texte `neutral-900`).
 * Les valeurs sont les hex de l'échelle `neutral` de Tailwind : au niveau SVG on n'a
 * pas de classes utilitaires, seulement des couleurs. Destinés à être réutilisés tel
 * quel par les prochains graphiques (frise `scatter` et bar mensuel de l'étape 9.4).
 * Section par section, avec l'usage : ce qui est neutre ici sert au calendrier (9.3),
 * ce qui est typé axe/série prépare la suite (9.4) — rien n'est décoratif.
 */
export const theme: PartialTheme = {
  // Le fond reste celui de la page (neutral-50 en CSS) : le SVG ne peint rien.
  background: 'transparent',
  // Textes généraux (légendes de mois/années du calendrier, libellés de séries).
  text: { fill: '#171717', fontFamily: 'inherit', fontSize: 12, outlineWidth: 0 },
  // Axes et grille : inutilisés par le calendrier, consommés par le bar de 9.4.
  axis: {
    domain: { line: { stroke: '#d4d4d4' } }, // neutral-300
    ticks: {
      line: { stroke: '#d4d4d4' },
      text: { fill: '#525252', fontFamily: 'inherit', fontSize: 12, outlineWidth: 0 }, // neutral-600
    },
    legend: { text: { fill: '#404040', fontFamily: 'inherit', fontSize: 12, outlineWidth: 0 } }, // neutral-700
  },
  grid: { line: { stroke: '#e5e5e5', strokeOpacity: 1, strokeDasharray: '2 4' } }, // neutral-200, discret
  crosshair: { line: { stroke: '#737373', strokeWidth: 1, strokeOpacity: 0.6, strokeDasharray: '3 3' } }, // neutral-500
  legends: {
    text: { fill: '#525252', fontFamily: 'inherit', fontSize: 12, outlineWidth: 0 },
    title: {
      text: { fill: '#171717', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, outlineWidth: 0 },
    },
  },
  labels: { text: { fill: '#171717', fontFamily: 'inherit', fontSize: 12, outlineWidth: 0 } },
  // Infobulle : carte papier cohérente avec les panneaux du domaine (neutral-50 / bord neutral-200).
  tooltip: {
    container: {
      borderRadius: '6px',
      fontSize: '12px',
      color: '#171717',
      background: '#fafafa',
      boxShadow: '0 2px 8px rgb(23 23 23 / 0.15)',
    },
    basic: { padding: '8px 10px' },
    chip: {},
    table: {},
    tableCell: { color: '#525252', padding: '2px 0' },
    tableCellValue: { color: '#171717', fontWeight: 600 },
  },
}
