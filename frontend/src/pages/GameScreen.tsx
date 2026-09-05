import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGameState, getRoundStats, guessPlayer } from '../api'
import { ScoreHUD } from '../components/ScoreHUD'
import { StatsTable } from '../components/StatsTable'
import { PlayerAutocompleteInput } from '../components/PlayerAutocompleteInput'
import { RoundReveal } from '../components/RoundReveal'
import type { RevealedPlayer } from '../types'

const TOTAL_ROUNDS = 5
const TOTAL_GUESSES = 3

interface Hud {
    score: number
    round: number
    guessesRemaining: number
    gameOver: boolean
}

export function GameScreen() {
    const { gameId } = useParams<{ gameId: string }>()
    const [hud, setHud] = useState<Hud | null>(null)
    const [statsJson, setStatsJson] = useState<Record<string, Record<string, string | null>> | null>(null)
    const [reveal, setReveal] = useState<{ player: RevealedPlayer; correct: boolean } | null>(null)
    const [wrongMessage, setWrongMessage] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!gameId) return
        let cancelled = false
        Promise.all([getGameState(gameId), getRoundStats(gameId)])
            .then(([state, stats]) => {
                if (cancelled) return
                setHud({
                    score: state.current_score,
                    round: state.current_round,
                    guessesRemaining: state.guesses_remaining,
                    gameOver: state.game_over,
                })
                setStatsJson(stats.stats_json)
            })
            .catch(() => {
                if (!cancelled) setError(true)
            })
        return () => {
            cancelled = true
        }
    }, [gameId])

    const handleGuess = async (playerId: string) => {
        if (!gameId || submitting) return
        setSubmitting(true)
        setWrongMessage(false)
        try {
            const res = await guessPlayer(gameId, playerId)
            setHud({
                score: res.current_score,
                round: res.current_round,
                guessesRemaining: res.guesses_remaining,
                gameOver: res.game_over,
            })
            if (res.revealed_player) {
                setReveal({ player: res.revealed_player, correct: res.last_guess })
            } else {
                setWrongMessage(true)
            }
        } catch {
            setError(true)
        } finally {
            setSubmitting(false)
        }
    }

    const handleContinue = async () => {
        if (!gameId || !hud) return
        setReveal(null)
        if (hud.gameOver) return
        try {
            const stats = await getRoundStats(gameId)
            setStatsJson(stats.stats_json)
        } catch {
            setError(true)
        }
    }

    if (error) {
        return (
            <div className="page">
                <p className="label">Couldn't load this game.</p>
                <Link to="/">Start a new one</Link>
            </div>
        )
    }

    if (!hud || !statsJson) {
        return (
            <div className="page">
                <p className="label">Loading…</p>
            </div>
        )
    }

    if (hud.gameOver && !reveal) {
        return (
            <div className="page GameOver">
                <span className="label">Game over</span>
                <h1 className="display GameOver-score">{hud.score}/15</h1>
                <p className="label">Final score</p>
                <Link to="/" className="Home-start GameOver-again">Play again</Link>
            </div>
        )
    }

    return (
        <div className="page">
            <ScoreHUD
                currentRound={hud.round}
                totalRounds={TOTAL_ROUNDS}
                score={hud.score}
                guessesRemaining={hud.guessesRemaining}
                totalGuesses={TOTAL_GUESSES}
            />
            {reveal ? (
                <RoundReveal
                    player={reveal.player}
                    correct={reveal.correct}
                    isLastRound={hud.gameOver}
                    onContinue={handleContinue}
                />
            ) : (
                <>
                    <StatsTable statsJson={statsJson} />
                    <PlayerAutocompleteInput onGuess={handleGuess} disabled={submitting} />
                    {wrongMessage && (
                        <p className="label GameScreen-wrong">
                            Not quite — {hud.guessesRemaining} guess{hud.guessesRemaining === 1 ? '' : 'es'} left
                        </p>
                    )}
                </>
            )}
        </div>
    )
}
