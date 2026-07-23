import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './AppContext'
import Login from './pages/Login'
import Layout from './pages/Layout'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Layout />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
