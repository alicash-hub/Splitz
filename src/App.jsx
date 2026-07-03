import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JoinByCode from './pages/JoinByCode'
import TripPage from './pages/TripPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinByCode />} />
        <Route path="/t/:slug" element={<TripPage />} />
      </Routes>
    </BrowserRouter>
  )
}
