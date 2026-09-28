import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

export function SiteHeader() {
    const { pathname } = useLocation()

    // home is the wordmark, so it only gets the toggle
    if (pathname === '/') {
        return (
            <header className="SiteHeader SiteHeader-bare">
                <ThemeToggle />
            </header>
        )
    }

    return (
        <header className="SiteHeader">
            <Link to="/" className="SiteHeader-wordmark">bballguessr</Link>
            <ThemeToggle />
        </header>
    )
}
