/**
 * Période figée du prototype (spec §1) : premier trimestre 1934.
 * Les dates ISO `YYYY-MM-DD` sont comparables lexicographiquement : pas de parse nécessaire.
 */
export const PERIODE_1934 = { du: '1934-01-01', au: '1934-03-31' } as const

/** La date ISO donnée tombe-t-elle dans le trimestre ? */
export function estDansLaPeriode(date: string): boolean {
  return date >= PERIODE_1934.du && date <= PERIODE_1934.au
}
