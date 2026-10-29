/**
 * Bandeau « Prototype — données fictives » (spec §1, ADR C-008) : le corpus est
 * commissionné et inventé ; l'afficher n'est pas une coquetterie, c'est une exigence
 * d'honnêteté envers le juré. Le texte fait foi (tests E2E sur libellés réels, C-006).
 */
export function BandeauPrototype() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-100 px-6 py-3 text-center text-sm text-neutral-500">
      Prototype — données fictives.
    </footer>
  )
}
