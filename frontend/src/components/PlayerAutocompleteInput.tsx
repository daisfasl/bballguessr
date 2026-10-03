import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { autocompletePlayers } from '../api'
import type { PlayerMatch } from '../types'

interface PlayerAutocompleteInputProps {
    onGuess: (match: PlayerMatch) => void
    busy?: boolean
    // bump to shake the field (a wrong guess)
    shakeKey?: number
    autoFocus?: boolean
}

export function PlayerAutocompleteInput({ onGuess, busy, shakeKey = 0, autoFocus }: PlayerAutocompleteInputProps) {
    const [query, setQuery] = useState('')
    const [matches, setMatches] = useState<PlayerMatch[]>([])
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(-1)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fieldRef = useRef<HTMLDivElement>(null)
    const listId = useId()

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!query.trim()) {
            setMatches([])
            setActive(-1)
            return
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await autocompletePlayers(query.trim())
                setMatches(res.players)
                setActive(res.players.length > 0 ? 0 : -1)
                setOpen(true)
            } catch {
                setMatches([])
                setActive(-1)
            }
        }, 200)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query])

    useEffect(() => {
        if (shakeKey === 0 || !fieldRef.current) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        fieldRef.current.animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-6px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(0)' },
            ],
            { duration: 250, easing: 'ease-out' },
        )
    }, [shakeKey])

    const handleSelect = (match: PlayerMatch) => {
        if (busy) return
        onGuess(match)
        setQuery('')
        setMatches([])
        setActive(-1)
        setOpen(false)
    }

    const showList = open && matches.length > 0

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' && matches.length > 0) {
            e.preventDefault()
            setOpen(true)
            setActive((i) => (i + 1) % matches.length)
        } else if (e.key === 'ArrowUp' && matches.length > 0) {
            e.preventDefault()
            setOpen(true)
            setActive((i) => (i <= 0 ? matches.length - 1 : i - 1))
        } else if (e.key === 'Enter' && showList && active >= 0) {
            e.preventDefault()
            handleSelect(matches[active])
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <div className="PlayerAutocompleteInput" ref={fieldRef}>
            <input
                type="text"
                className="PlayerAutocompleteInput-field"
                placeholder="Who is it?"
                aria-label="Guess a player"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
                aria-busy={busy || undefined}
                autoComplete="off"
                spellCheck={false}
                autoFocus={autoFocus}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => matches.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            <ul className="PlayerAutocompleteInput-dropdown" id={listId} role="listbox" hidden={!showList}>
                {matches.map((m, i) => (
                    <li
                        key={m.basketball_reference_id}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={i === active}
                        className={i === active ? 'is-active' : undefined}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelect(m)
                        }}
                        onMouseEnter={() => setActive(i)}
                    >
                        {m.name}
                    </li>
                ))}
            </ul>
        </div>
    )
}
