import './css/App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/home'
import { GameScreen } from './pages/GameScreen'

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/game/:gameId" element={<GameScreen />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
