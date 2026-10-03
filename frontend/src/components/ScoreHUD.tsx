import { useEffect, useRef, useState } from 'react'
import { BallGlyph } from './art/BallGlyph'

interface ScoreHUDProps {
    currentRound: number
    totalRounds: number
    score: number
    guessesRemaining: number
    totalGuesses: number
}

const pad = (n: number) => String(n).padStart(2, '0')

// counts up to a new score so a point gain is noticed; jumps straight there under reduced motion
function useTickingNumber(value: number) {
    const [shown, setShown] = useState(value)
    const fromRef = useRef(value)

    useEffect(() => {
        const from = fromRef.current
        fromRef.current = value
        if (from === value) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setShown(value)
            return
        }
        const start = performance.now()
        let frame = requestAnimationFrame(function step(now) {
            const t = Math.min(1, (now - start) / 400)
            setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))))
            if (t < 1) frame = requestAnimationFrame(step)
        })
        return () => cancelAnimationFrame(frame)
    }, [value])

    return shown
}

export function ScoreHUD({ currentRound, totalRounds, score, guessesRemaining, totalGuesses }: ScoreHUDProps) {
    const shownScore = useTickingNumber(score)

    return (
        <div className="ScoreHUD">
            <span className="ScoreHUD-round">
                <span className="callout-num">{pad(currentRound)}</span>
                <span className="label">of {pad(totalRounds)}</span>
            </span>
            <span className="ScoreHUD-pips" role="img" aria-label={`${guessesRemaining} of ${totalGuesses} guesses left`}>
                {Array.from({ length: totalGuesses }, (_, i) => (
                    <BallGlyph key={i} size={16} filled={i < guessesRemaining} />
                ))}
            </span>
            <span className="label ScoreHUD-score">
                Pts <span className="ScoreHUD-scoreNum">{pad(shownScore)}</span>
            </span>
        </div>
    )
}
