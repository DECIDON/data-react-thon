import { HomePage } from '@/pages/HomePage'
import { config } from '@/platform/config'
import { BrowserRouter, Route, Routes } from 'react-router'

/**
 * Bootstrap UI : providers + registre de routes.
 * Aucune URL absolue codée : le basename vient de `config.basePath` (VITE_BASE_PATH).
 */
export function App() {
  return (
    <BrowserRouter basename={config.basePath}>
      <Routes>
        <Route index element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
