import type { ReactNode } from 'react'

interface CrosshairProps {
    children: ReactNode
    className?: string
}

// a printer's registration "+" with a mono note beside it
export function Crosshair({ children, className }: CrosshairProps) {
    return (
        <span className={className ? `Crosshair ${className}` : 'Crosshair'}>
            <svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true">
                <path d="M6.5 0v13M0 6.5h13" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="label Crosshair-text">{children}</span>
        </span>
    )
}
