import { useEffect, useState } from 'react'
import { getWikipediaSummary, wikipediaUrl, youtubeHighlightsUrl } from '../lib/wikipedia'
import type { RevealedPlayer } from '../types'

interface PlayerAboutProps {
    id: string
    player: RevealedPlayer
}

type Summary = { status: 'loading' } | { status: 'ready'; text: string } | { status: 'missing' }

export function PlayerAbout({ id, player }: PlayerAboutProps) {
    const title = player.wikipedia_title
    const [summary, setSummary] = useState<Summary>(title ? { status: 'loading' } : { status: 'missing' })

    useEffect(() => {
        if (!title) return
        let cancelled = false
        getWikipediaSummary(title)
            .then((text) => !cancelled && setSummary({ status: 'ready', text }))
            .catch(() => !cancelled && setSummary({ status: 'missing' }))
        return () => {
            cancelled = true
        }
    }, [title])

    return (
        <section id={id} className="PlayerAbout" aria-label={`About ${player.name}`}>
            {summary.status === 'loading' && <p className="PlayerAbout-status">Loading summary…</p>}
            {summary.status === 'ready' && <p className="PlayerAbout-summary">{summary.text}</p>}
            <p className="PlayerAbout-links">
                {title && (
                    <a href={wikipediaUrl(title)} target="_blank" rel="noreferrer">Read more on Wikipedia</a>
                )}
                <a href={youtubeHighlightsUrl(player.name)} target="_blank" rel="noreferrer">Watch highlights on YouTube</a>
            </p>
        </section>
    )
}
