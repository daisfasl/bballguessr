import type { GamePreset } from '../types'

interface ModeOption {
    id: GamePreset
    name: string
    hint: string
}

const MODES: ModeOption[] = [
    { id: 'all_stars', name: 'All-Stars', hint: '536 players · at least one All-Star season · a good default' },
    { id: 'legends', name: 'Legends', hint: '166 players · five or more All-Star seasons · the most recognizable names' },
    { id: 'everyone', name: 'Everyone', hint: '5,409 players · no filter · hardcore' },
    { id: 'custom', name: 'Custom', hint: 'set your own filters' },
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
                    <span className="label ModePicker-hint">{mode.hint}</span>
                </button>
            ))}
        </div>
    )
}
