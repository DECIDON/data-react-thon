/**
 * Page unique du squelette : la définition of done minimale (« une page qui affiche Hello World »).
 * Contrat de test : rôle accessible `heading`, libellé réel — zéro `data-testid` (TESTING.md).
 */
export function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-8">
      <h1 className="text-5xl font-bold tracking-tight">Hello World</h1>
    </main>
  )
}
