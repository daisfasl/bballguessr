import { useNavigate } from 'react-router-dom'
import { HalftoneBall } from '../components/art/HalftoneBall'
import { Crosshair } from '../components/Crosshair'

export function Home() {
    const navigate = useNavigate()

    return (
        <div className="page Home-page">
            <div className="Home-hero">
                <HalftoneBall size={320} className="Home-ball" />
                <div className="Home-notes">
                    <Crosshair className="Home-note Home-note-rounds">5 rounds</Crosshair>
                    <Crosshair className="Home-note Home-note-guesses">3 guesses</Crosshair>
                    <Crosshair className="Home-note Home-note-era">1947–2026</Crosshair>
                </div>
            </div>

            <h1 className="display Home-title">bballguessr</h1>
            <p className="Home-desc">
                Five NBA players. Only their basketball-reference stat lines to go on.
                Three guesses each round.
            </p>

            <div className="Home-actions">
                <button type="button" className="btn" onClick={() => navigate('/play')}>
                    Quick play
                </button>
                <span className="Home-soon">
                    <button type="button" className="btn btn-ghost" disabled>
                        Create challenge
                    </button>
                    <span className="pill">Soon</span>
                </span>
            </div>

            <p className="Home-credit">
                Stats from <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer">Basketball-Reference.com</a>
            </p>
        </div>
    )
}
