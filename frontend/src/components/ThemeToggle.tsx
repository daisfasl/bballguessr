import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeTheme } from '../lib/theme'

export function ThemeToggle() {
    const theme = useSyncExternalStore(subscribeTheme, getTheme)
    const next = theme === 'dark' ? 'light' : 'dark'

    return (
        <button
            type="button"
            className="ThemeToggle"
            onClick={() => setTheme(next)}
            aria-label={`Switch to ${next} theme`}
            title={`Switch to ${next} theme`}
        >
            {/* half-filled disc: the filled half is the current theme's ink */}
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 1.75 A8.25 8.25 0 0 1 10 18.25 Z" fill="currentColor" />
            </svg>
        </button>
    )
}
