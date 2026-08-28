import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startGame } from '../api'
import { ModePicker } from '../components/ModePicker'
import { CustomFilters } from '../components/CustomFilters'
import type { GamePreset, CustomFilterValues, GameFilters } from '../types'
import '../css/play.css'

const DEFAULT_CUSTOM_FILTERS: CustomFilterValues = {
    min_career_length: 1,
    min_allstar_count: 0,
    min_allnba_count: 0,
    start_year_min: 1947,
    start_year_max: 2026,
}

export function Play() {
    const navigate = useNavigate()
    const [preset, setPreset] = useState<GamePreset>('all_stars')
    const [customFilters, setCustomFilters] = useState<CustomFilterValues>(DEFAULT_CUSTOM_FILTERS)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleStart = async () => {
        setLoading(true)
        setError(null)
        try {
            const filters: GameFilters = preset === 'custom'
                ? { preset, ...customFilters }
                : { preset }
            const gameId = await startGame(filters)
            navigate(`/game/${gameId}`)
        } catch (err) {
            const detail = err instanceof Error ? err.message : ''
            setError(detail || "Couldn't start a game — try again.")
            setLoading(false)
        }
    }

    return (
        <div className="page Play-page">
            <Link to="/" className="label Play-back">&larr; Back</Link>
            <h1 className="display Play-title">Choose a mode</h1>
            <hr className="rule Play-rule" />

            <ModePicker selected={preset} onSelect={setPreset} />

            {preset === 'custom' && (
                <>
                    <hr className="rule Play-rule" />
                    <CustomFilters values={customFilters} onChange={setCustomFilters} />
                </>
            )}

            <hr className="rule Play-rule" />

            <button type="button" className="Home-start" onClick={handleStart} disabled={loading}>
                {loading ? 'Starting…' : 'Start game'}
            </button>
            {error && <p className="label Play-error">{error}</p>}
        </div>
    )
}
