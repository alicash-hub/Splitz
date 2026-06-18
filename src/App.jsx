import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TripDashboard from './pages/TripDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/t/:slug" element={<TripDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
