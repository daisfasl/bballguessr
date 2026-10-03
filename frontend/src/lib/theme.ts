// theme = OS preference unless the user picked one; the pick lives on <html data-theme> + localStorage
// (index.html applies a saved pick before first paint)

export type Theme = 'light' | 'dark'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

export function getTheme(): Theme {
    const picked = document.documentElement.dataset.theme
    if (picked === 'light' || picked === 'dark') return picked
    return darkQuery.matches ? 'dark' : 'light'
}

// browser chrome color follows the page, including a manual pick
const PAPER: Record<Theme, string> = { light: '#E4E2DC', dark: '#151514' }

function syncThemeColor(theme: Theme) {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', PAPER[theme]))
}

if (document.documentElement.dataset.theme) syncThemeColor(getTheme())

export function setTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme
    syncThemeColor(theme)
    try {
        localStorage.setItem('theme', theme)
    } catch {
        // storage blocked — the pick still applies for this visit
    }
}

// fires on an explicit pick or an OS change; shaped for useSyncExternalStore
export function subscribeTheme(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    darkQuery.addEventListener('change', onChange)
    return () => {
        observer.disconnect()
        darkQuery.removeEventListener('change', onChange)
    }
}
