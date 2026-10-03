import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGameState, getRoundStats, guessPlayer } from '../api'
import { ScoreHUD } from '../components/ScoreHUD'
import { StatsTable } from '../components/StatsTable'
import { PlayerAutocompleteInput } from '../components/PlayerAutocompleteInput'
import { RoundReveal } from '../components/RoundReveal'
import { CourtLines } from '../components/art/CourtLines'
import { BallGlyph } from '../components/art/BallGlyph'
import type { PlayerMatch, RevealedPlayer } from '../types'

const TOTAL_ROUNDS = 5
const TOTAL_GUESSES = 3
const MAX_SCORE = TOTAL_ROUNDS * TOTAL_GUESSES

interface Hud {
    score: number
    round: number
    guessesRemaining: number
    gameOver: boolean
}

// one finished round, kept client-side for the game-over recap (lost on refresh)
interface RoundResult {
    player: RevealedPlayer
    points: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export function GameScreen() {
    const { gameId } = useParams<{ gameId: string }>()
    const [hud, setHud] = useState<Hud | null>(null)
    const [statsJson, setStatsJson] = useState<Record<string, Record<string, string | null>> | null>(null)
    const [reveal, setReveal] = useState<RoundResult | null>(null)
    const [recap, setRecap] = useState<RoundResult[]>([])
    const [wrongGuesses, setWrongGuesses] = useState<PlayerMatch[]>([])
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

    const handleGuess = async (match: PlayerMatch) => {
        if (!gameId || !hud || submitting) return
        setSubmitting(true)
        try {
            const res = await guessPlayer(gameId, match.basketball_reference_id)
            setHud({
                score: res.current_score,
                round: res.current_round,
                guessesRemaining: res.guesses_remaining,
                gameOver: res.game_over,
            })
            if (res.revealed_player) {
                const result = { player: res.revealed_player, points: res.current_score - hud.score }
                setReveal(result)
                setRecap((prev) => [...prev, result])
            } else {
                setWrongGuesses((prev) => [...prev, match])
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
        setWrongGuesses([])
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
            <div className="page GameScreen-status">
                <p>This game has expired or the server restarted.</p>
                <Link to="/play" className="btn">Start a new game</Link>
            </div>
        )
    }

    if (!hud || !statsJson) {
        return (
            <div className="page GameScreen-status">
                <p className="GameScreen-loading">
                    <BallGlyph size={18} spinning /> Loading round…
                </p>
            </div>
        )
    }

    if (hud.gameOver && !reveal) {
        return (
            <div className="page GameOver">
                <p className="GameOver-score">
                    <span className="display GameOver-points">{hud.score}</span>
                    <span className="label GameOver-max">/ {MAX_SCORE}</span>
                </p>
                {recap.length > 0 && (
                    <ol className="GameOver-recap">
                        {recap.map((r, i) => (
                            <li key={r.player.basketball_reference_id} className={r.points > 0 ? undefined : 'is-missed'}>
                                <span className="callout-num">{pad(i + 1)}</span>
                                <span className="GameOver-name">{r.player.name}</span>
                                <span className="GameOver-leader" aria-hidden="true" />
                                <span className="label GameOver-result">{r.points > 0 ? `+${r.points}` : 'Missed'}</span>
                            </li>
                        ))}
                    </ol>
                )}
                <div className="GameOver-actions">
                    <Link to="/play" className="btn">Play again</Link>
                    <Link to="/" className="btn btn-ghost">Home</Link>
                </div>
            </div>
        )
    }

    return (
        <>
            <CourtLines />
            <div className="page GameScreen">
                <ScoreHUD
                    currentRound={reveal ? recap.length : hud.round}
                    totalRounds={TOTAL_ROUNDS}
                    score={hud.score}
                    guessesRemaining={reveal ? Math.max(0, reveal.points - 1) : hud.guessesRemaining}
                    totalGuesses={TOTAL_GUESSES}
                />
                {reveal ? (
                    <RoundReveal
                        player={reveal.player}
                        points={reveal.points}
                        isLastRound={hud.gameOver}
                        onContinue={handleContinue}
                    />
                ) : (
                    <>
                        <StatsTable statsJson={statsJson} />
                        <div className="GameScreen-guess">
                            {wrongGuesses.length > 0 && (
                                <ul className="GameScreen-wrong" aria-label="Wrong guesses">
                                    {wrongGuesses.map((g, i) => (
                                        <li key={`${g.basketball_reference_id}-${i}`} className="pill pill-struck">{g.name}</li>
                                    ))}
                                </ul>
                            )}
                            <PlayerAutocompleteInput
                                onGuess={handleGuess}
                                busy={submitting}
                                shakeKey={wrongGuesses.length}
                                autoFocus
                            />
                            <p className="GameScreen-hint" aria-live="polite">
                                {wrongGuesses.length > 0
                                    ? `Not him. ${hud.guessesRemaining} guess${hud.guessesRemaining === 1 ? '' : 'es'} left.`
                                    : ' '}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
