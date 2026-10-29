/**
 * Écran de repli pour une erreur de donnée (spec §2 : « une donnée invalide est une
 * erreur affichée »). L'`ErrorBoundary` global reste le filet de dernier recours ; ici,
 * l'erreur est attendue et rendue lisible, sans crash silencieux.
 */
export function ErreurCorpus({ message }: { readonly message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <h2 className="font-semibold">Le corpus 1934 n’a pas pu être chargé.</h2>
      <p className="mt-1 text-sm">{message}</p>
      <p className="mt-1 text-xs text-red-700/80">
        Le prototype est en lecture seule : rechargez la page ; si le problème persiste, le JSON fautif est
        signalé au journal.
      </p>
    </div>
  )
}
