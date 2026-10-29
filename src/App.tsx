import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { SujetPage } from '@/pages/SujetPage'
import { config } from '@/platform/config'
import { BrowserRouter, Route, Routes } from 'react-router'

/**
 * Bootstrap UI : providers + registre de routes (ARCHITECTURE.md §4).
 * Aucune URL absolue codée : le basename vient de `config.basePath` (VITE_BASE_PATH).
 * Le `Layout` unique porte le bandeau « Prototype — données fictives » sur tous les écrans.
 */
export function App() {
  return (
    <BrowserRouter basename={config.basePath}>
      <Layout>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="sujet/:id" element={<SujetPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
