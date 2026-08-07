import { pivotStats } from '../lib/stats'

interface StatsTableProps {
    statsJson: Record<string, Record<string, string | null>>
}

export function StatsTable({ statsJson }: StatsTableProps) {
    const { columns, rows } = pivotStats(statsJson)

    return (
        <div className="StatsTable-scroll">
            <table className="StatsTable">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col} className="label">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                                <td key={j}>{cell ?? '–'}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
