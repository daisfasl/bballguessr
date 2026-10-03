import { useEffect, useRef, useState } from 'react'
import { DitheredImage } from './art/DitheredImage'
import type { RevealedPlayer } from '../types'

interface RoundRevealProps {
    player: RevealedPlayer
    points: number
    isLastRound: boolean
    onContinue: () => void
}

export function RoundReveal({ player, points, isLastRound, onContinue }: RoundRevealProps) {
    const [ready, setReady] = useState(false)
    const continueRef = useRef<HTMLButtonElement>(null)
    const correct = points > 0
    // scoring is guesses_remaining + 1, so 3 points = first guess
    const guessNumber = 4 - points

    // the text lands once the headshot has developed; never wait on it forever
    useEffect(() => {
        const fallback = setTimeout(() => setReady(true), 1500)
        return () => clearTimeout(fallback)
    }, [])

    useEffect(() => {
        if (ready) continueRef.current?.focus()
    }, [ready])

    return (
        <div className={ready ? 'RoundReveal is-ready' : 'RoundReveal'}>
            <DitheredImage src={player.img_url} alt={player.name} size={240} onReady={() => setReady(true)} />
            <div className="RoundReveal-body" aria-live="polite">
                {ready && (
                    <>
                        {correct
                            ? <span className="pill pill-solid">+{points}</span>
                            : <span className="pill">Missed</span>}
                        <h2 className="display RoundReveal-name">{player.name}</h2>
                        <p className="RoundReveal-caption">
                            {correct ? `Got it on guess ${guessNumber}.` : 'Out of guesses.'}
                        </p>
                        <button ref={continueRef} type="button" className="btn" onClick={onContinue}>
                            {isLastRound ? 'See results' : 'Next round'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
