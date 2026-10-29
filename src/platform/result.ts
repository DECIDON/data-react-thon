/**
 * FunctionResult — pattern « résultat de fonction » (D-002, recopié de la foundation).
 * Frontière de commande : pas d'exception remontée vers l'UI, un `FunctionResult` typé.
 * `ok: true` transporte une valeur ; `ok: false` transporte une erreur typée `E`.
 */

export interface Ok<T> {
  readonly ok: true
  readonly value: T
}

export interface Err<E> {
  readonly ok: false
  readonly error: E
}

export type FunctionResult<T, E> = Ok<T> | Err<E>

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

/** Étroit vers Ok et renvoie la valeur ; sinon renvoie `undefined` (pattern discriminé). */
export function valueOf<T, E>(result: FunctionResult<T, E>): T | undefined {
  return result.ok ? result.value : undefined
}

/** Étroit vers Err et renvoie l'erreur ; sinon `undefined`. */
export function errorOf<T, E>(result: FunctionResult<T, E>): E | undefined {
  return result.ok ? undefined : result.error
}
