import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex min-h-screen items-center justify-center bg-surface p-8">
                <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
                  <h1 className="text-2xl font-semibold text-bbu-blue">BBU LMS</h1>
                  <p className="mt-2 text-text-muted">React + Vite + Tailwind scaffold is ready.</p>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App
