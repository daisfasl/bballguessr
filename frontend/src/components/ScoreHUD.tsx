interface ScoreHUDProps {
    currentRound: number
    totalRounds: number
    score: number
    guessesRemaining: number
    totalGuesses: number
}

export function ScoreHUD({ currentRound, totalRounds, score, guessesRemaining, totalGuesses }: ScoreHUDProps) {
    const dots = Array.from({ length: totalGuesses }, (_, i) => i < guessesRemaining)

    return (
        <div className="ScoreHUD">
            <span className="label">Round {currentRound} / {totalRounds}</span>
            <span className="label ScoreHUD-dots" aria-label={`${guessesRemaining} guesses remaining`}>
                {dots.map((filled, i) => (
                    <span key={i} className={filled ? "guess-dot guess-dot-filled" : "guess-dot guess-dot-empty"} />
                ))}
            </span>
            <span className="label">Score {score}</span>
        </div>
    )
}
