import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startGame } from '../api'

export function Home() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const handleStart = async () => {
        setLoading(true)
        setError(false)
        try {
            const gameId = await startGame()
            navigate(`/game/${gameId}`)
        } catch {
            setError(true)
            setLoading(false)
        }
    }

    return (
        <div className="page Home-page">
            <h1 className="display Home-title">
                bballguessr
            </h1>
            <hr className="rule Home-rule" />
            <p className="Home-desc">
                Five NBA players. Only their basketball-reference stat lines to go on.
                Three guesses each round.
            </p>
            <button type="button" className="Home-start" onClick={handleStart} disabled={loading}>
                {loading ? 'Starting…' : 'Start game'}
            </button>
            {error && <p className="label Home-error">Couldn't start a game — try again.</p>}
        </div>
    )
}
