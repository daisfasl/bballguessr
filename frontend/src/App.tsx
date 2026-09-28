import './css/App.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/home'
import { Play } from './pages/Play'
import { GameScreen } from './pages/GameScreen'
import { SiteHeader } from './components/SiteHeader'

// dev-only design lab; tree-shaken out of production builds
const ArtLab = import.meta.env.DEV ? lazy(() => import('./pages/artlab/ArtLab')) : null

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <SiteHeader />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/play" element={<Play />} />
                    <Route path="/game/:gameId" element={<GameScreen />} />
                    {ArtLab && (
                        <Route path="/__art" element={<Suspense><ArtLab /></Suspense>} />
                    )}
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
