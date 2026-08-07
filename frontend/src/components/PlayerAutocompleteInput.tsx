import { useEffect, useRef, useState } from 'react'
import { autocompletePlayers } from '../api'
import type { PlayerMatch } from '../types'

interface PlayerAutocompleteInputProps {
    onGuess: (basketballReferenceId: string) => void
    disabled?: boolean
}

export function PlayerAutocompleteInput({ onGuess, disabled }: PlayerAutocompleteInputProps) {
    const [query, setQuery] = useState('')
    const [matches, setMatches] = useState<PlayerMatch[]>([])
    const [open, setOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!query.trim()) {
            setMatches([])
            return
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await autocompletePlayers(query.trim())
                setMatches(res.players)
                setOpen(true)
            } catch {
                setMatches([])
            }
        }, 200)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query])

    const handleSelect = (match: PlayerMatch) => {
        onGuess(match.basketball_reference_id)
        setQuery('')
        setMatches([])
        setOpen(false)
    }

    return (
        <div className="PlayerAutocompleteInput">
            <input
                type="text"
                className="PlayerAutocompleteInput-field"
                placeholder="Type a player's name…"
                value={query}
                disabled={disabled}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => matches.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && matches.length > 0 && (
                <ul className="PlayerAutocompleteInput-dropdown">
                    {matches.map((m) => (
                        <li key={m.basketball_reference_id}>
                            <button type="button" onMouseDown={() => handleSelect(m)}>
                                {m.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
