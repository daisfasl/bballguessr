import { useEffect, useId, useRef, useState } from 'react'
import { DitheredImage } from './art/DitheredImage'
import { PlayerAbout } from './PlayerAbout'
import type { RevealedPlayer } from '../types'

interface RoundRevealProps {
    player: RevealedPlayer
    points: number
    gaveUp: boolean
    isLastRound: boolean
    onContinue: () => void
}

const ABOUT_OPEN_KEY = 'about-open'

// remembered across rounds and visits so players who like the About panel don't reopen it every time
function readAboutOpen(): boolean {
    try {
        return localStorage.getItem(ABOUT_OPEN_KEY) === 'true'
    } catch {
        return false
    }
}

function writeAboutOpen(open: boolean) {
    try {
        localStorage.setItem(ABOUT_OPEN_KEY, String(open))
    } catch {
        // storage blocked — the panel just won't stay open next round
    }
}

export function RoundReveal({ player, points, gaveUp, isLastRound, onContinue }: RoundRevealProps) {
    const [ready, setReady] = useState(false)
    const [aboutOpen, setAboutOpen] = useState(readAboutOpen)
    const aboutId = useId()
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

    const toggleAbout = () => {
        setAboutOpen((open) => {
            writeAboutOpen(!open)
            return !open
        })
    }

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
                            {correct ? `Got it on guess ${guessNumber}.` : gaveUp ? 'Gave up.' : 'Out of guesses.'}
                        </p>
                        <div className="RoundReveal-actions">
                            <button ref={continueRef} type="button" className="btn" onClick={onContinue}>
                                {isLastRound ? 'See results' : 'Next round'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                aria-expanded={aboutOpen}
                                aria-controls={aboutId}
                                onClick={toggleAbout}
                            >
                                {aboutOpen ? 'Hide about' : 'About'}
                            </button>
                        </div>
                        {aboutOpen && <PlayerAbout id={aboutId} player={player} />}
                    </>
                )}
            </div>
        </div>
    )
}
