import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TripPage from './pages/TripPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/t/:slug" element={<TripPage />} />
      </Routes>
    </BrowserRouter>
  )
}
