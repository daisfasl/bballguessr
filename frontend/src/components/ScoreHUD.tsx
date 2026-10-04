import { BallGlyph } from './art/BallGlyph'

interface ScoreHUDProps {
    currentRound: number
    totalRounds: number
    score: number
    guessesRemaining: number
    totalGuesses: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export function ScoreHUD({ currentRound, totalRounds, score, guessesRemaining, totalGuesses }: ScoreHUDProps) {
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
                Pts <span className="ScoreHUD-scoreNum">{pad(score)}</span>
            </span>
        </div>
    )
}
