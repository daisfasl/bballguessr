import './css/App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/home'
import { Play } from './pages/Play'
import { GameScreen } from './pages/GameScreen'

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/play" element={<Play />} />
                    <Route path="/game/:gameId" element={<GameScreen />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
