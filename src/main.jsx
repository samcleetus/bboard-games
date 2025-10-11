import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router.jsx'
import { RouterProvider } from 'react-router-dom'
import { AuthContextProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
    <h1 className="text-center pt-4 text-3xl">BBoard Games</h1>

    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
    </>
  </StrictMode>,
)
