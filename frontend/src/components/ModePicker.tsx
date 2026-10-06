import type { GamePreset } from '../types'

interface ModeOption {
    id: GamePreset
    name: string
    count: string
    blurb: string
}

const MODES: ModeOption[] = [
    { id: 'curated', name: 'Curated', count: '~470 players', blurb: 'Well-known players. The recommended place to start.' },
    { id: 'all_stars', name: 'All-Stars', count: '536 players', blurb: 'Anyone with at least one All-Star season.' },
    { id: 'legends', name: 'Legends', count: '166 players', blurb: 'Five or more All-Star seasons. The most recognizable names.' },
    { id: 'everyone', name: 'Everyone', count: '5,409 players', blurb: 'No filter at all, basically impossible!' },
    { id: 'custom', name: 'Custom', count: '', blurb: 'Set your own career length, accolades and era.' },
]

interface ModePickerProps {
    selected: GamePreset
    onSelect: (preset: GamePreset) => void
}

export function ModePicker({ selected, onSelect }: ModePickerProps) {
    return (
        <div className="ModePicker">
            {MODES.map((mode) => (
                <button
                    key={mode.id}
                    type="button"
                    className={mode.id === selected ? 'ModePicker-option ModePicker-option-selected' : 'ModePicker-option'}
                    onClick={() => onSelect(mode.id)}
                    aria-pressed={mode.id === selected}
                >
                    <span className="display ModePicker-name">{mode.name}</span>
                    {mode.count && <span className="label ModePicker-count">{mode.count}</span>}
                    <span className="ModePicker-blurb">{mode.blurb}</span>
                </button>
            ))}
        </div>
    )
}
