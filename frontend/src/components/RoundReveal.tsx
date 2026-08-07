import type { RevealedPlayer } from '../types'

interface RoundRevealProps {
    player: RevealedPlayer
    correct: boolean
    isLastRound: boolean
    onContinue: () => void
}

export function RoundReveal({ player, correct, isLastRound, onContinue }: RoundRevealProps) {
    return (
        <div className="RoundReveal">
            <span className="label">{correct ? 'Correct' : 'Round over'}</span>
            {player.img_url && (
                <img className="RoundReveal-img" src={player.img_url} alt={player.name} />
            )}
            <h2 className="display RoundReveal-name">{player.name}</h2>
            <button type="button" className="RoundReveal-continue" onClick={onContinue}>
                {isLastRound ? 'See results' : 'Next round'}
            </button>
        </div>
    )
}
