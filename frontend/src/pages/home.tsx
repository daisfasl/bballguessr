import { useNavigate } from 'react-router-dom'

export function Home() {
    const navigate = useNavigate()

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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.25rem' }}>
                <button type="button" className="Home-start" onClick={() => navigate('/play')}>
                    Quick play
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <button type="button" className="Home-start" disabled>
                        Create challenge
                    </button>
                    <span className="label">Coming soon</span>
                </div>
            </div>
        </div>
    )
}
