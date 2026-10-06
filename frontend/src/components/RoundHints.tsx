import type { Hint } from '../types'

const LABELS: Record<Hint['kind'], string> = {
    initials: 'Initials',
    letters: 'Letters',
}

interface RoundHintsProps {
    hints: Hint[]
}

export function RoundHints({ hints }: RoundHintsProps) {
    // the live region stays mounted so each newly unlocked hint gets announced
    return (
        <div aria-live="polite">
            {hints.length > 0 && (
                <dl className="RoundHints">
                    {hints.map((hint) => (
                        <div key={hint.kind} className="RoundHints-row">
                            <dt className="label">{LABELS[hint.kind]}</dt>
                            <dd>{hint.kind === 'letters' ? <LetterBlanks pattern={hint.value} /> : hint.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    )
}

// "______ _'____" -> underline cells per letter, punctuation kept, crossword-style counts after
function LetterBlanks({ pattern }: { pattern: string }) {
    const words = pattern.split(' ')
    const counts = words.map((w) => w.replaceAll(/[^_]/g, '').length)

    return (
        <>
            <span className="RoundHints-blanks" aria-hidden="true">
                {words.map((word, i) => (
                    <span key={i} className="RoundHints-word">
                        {[...word].map((c, j) =>
                            c === '_'
                                ? <span key={j} className="RoundHints-cell" />
                                : <span key={j} className="RoundHints-mark">{c}</span>,
                        )}
                    </span>
                ))}
            </span>
            <span className="RoundHints-count">
                <span className="visually-hidden">Letters per word: </span>({counts.join(', ')})
            </span>
        </>
    )
}
