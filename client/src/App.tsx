import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Lobby from './pages/Lobby'
import Room from './pages/Room'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/lobby/:roomId" element={<Lobby />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  )
}

export default App
