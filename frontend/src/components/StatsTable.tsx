import { useEffect, useRef, useState } from 'react'
import { pivotStats, rowNote, splitAwards, TEXT_COLUMNS } from '../lib/stats'

interface StatsTableProps {
    statsJson: Record<string, Record<string, string | null>>
}

export function StatsTable({ statsJson }: StatsTableProps) {
    const { columns, rows } = pivotStats(statsJson)
    const seasonIdx = columns.indexOf('Season')
    const scrollRef = useRef<HTMLDivElement>(null)
    const [edges, setEdges] = useState({ start: true, end: true })

    // fade whichever edge still has more table behind it
    const updateEdges = () => {
        const el = scrollRef.current
        if (!el) return
        setEdges({
            start: el.scrollLeft <= 1,
            end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
        })
    }

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollLeft = 0
        updateEdges()
        const observer = new ResizeObserver(updateEdges)
        observer.observe(el)
        return () => observer.disconnect()
    }, [statsJson])

    return (
        <div
            ref={scrollRef}
            className="StatsTable-scroll"
            data-fade-start={!edges.start || undefined}
            data-fade-end={!edges.end || undefined}
            onScroll={updateEdges}
            tabIndex={0}
            role="region"
            aria-label="Career stats, per game"
        >
            <table className="StatsTable">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col} scope="col" className={TEXT_COLUMNS.has(col) ? 'is-text' : undefined}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        // a traded season lists the combined line first, then one row per team
                        const isTeamSplit = seasonIdx >= 0 && i > 0 && row[seasonIdx] === rows[i - 1][seasonIdx]
                        const note = rowNote(columns, row)
                        if (note) {
                            return (
                                <tr key={i} className="StatsTable-note">
                                    <td className="is-text">{seasonIdx >= 0 ? row[seasonIdx] : ''}</td>
                                    <td className="is-text" colSpan={columns.length - 1}>{note}</td>
                                </tr>
                            )
                        }
                        return (
                            <tr key={i} className={isTeamSplit ? 'StatsTable-split' : undefined}>
                                {row.map((cell, j) => {
                                    const col = columns[j]
                                    if (col === 'Awards') {
                                        return (
                                            <td key={j} className="is-text">
                                                <span className="StatsTable-awards">
                                                    {splitAwards(cell).map((award) => (
                                                        <span key={award} className="pill">{award}</span>
                                                    ))}
                                                </span>
                                            </td>
                                        )
                                    }
                                    return (
                                        <td key={j} className={TEXT_COLUMNS.has(col) ? 'is-text' : undefined}>
                                            {cell || '–'}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
