/**
 * Harnais de test (TESTING.md « harnais à recopier »). Chaque stub porte la raison de son existence :
 * on ne stubbe que ce que le socle exige réellement, rien d'anticipé.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup systématique RTL : pas de fuite de DOM entre tests (symptomatologie du projet source).
afterEach(() => {
  cleanup()
})

// matchMedia : requis dès qu'une primitive Radix est montée ; stub minimal déterministe.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// ResizeObserver : requis par toute primitive de mesure (dnd-kit, Radix) ; sans lui, échecs diffus.
if (!('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}

// fake-indexeddb : à activer au premier repository (`import 'fake-indexeddb/auto'`), pas avant.
