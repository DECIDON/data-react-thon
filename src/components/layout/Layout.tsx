import type { ReactNode } from 'react'
import { BandeauPrototype } from './BandeauPrototype'

/**
 * L'unique layout de l'app (spec §1) : colonne pleine hauteur, contenu qui respire,
 * pied de page « Prototype — données fictives » présent sur tous les écrans (C-008).
 * Monté par `App.tsx` autour du registre de routes : pas de second layout prévu.
 */
export function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{children}</div>
      <BandeauPrototype />
    </div>
  )
}
