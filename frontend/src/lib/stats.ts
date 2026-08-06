// stats_json comes back column-oriented: { "PTS": {"0": "11.4", "1": "13.2", ...}, ... }
// with unordered keys. This pivots it into ordered rows for display.

export const BREF_COLUMN_ORDER = [
    "Season", "Age", "Team", "Lg", "Pos", "G", "GS", "MP",
    "FG", "FGA", "FG%", "3P", "3PA", "3P%", "2P", "2PA", "2P%", "eFG%",
    "FT", "FTA", "FT%", "ORB", "DRB", "TRB", "AST", "STL", "BLK", "TOV", "PF", "PTS",
    "Awards",
]

export interface PivotedStats {
    columns: string[]
    rows: (string | null)[][]
}

export function pivotStats(statsJson: Record<string, Record<string, string | null>>): PivotedStats {
    const presentKeys = Object.keys(statsJson)
    const ordered = BREF_COLUMN_ORDER.filter((col) => presentKeys.includes(col))
    const extras = presentKeys.filter((col) => !BREF_COLUMN_ORDER.includes(col))
    const columns = [...ordered, ...extras]

    const rowIndices = new Set<number>()
    for (const col of columns) {
        for (const idx of Object.keys(statsJson[col] ?? {})) {
            rowIndices.add(Number(idx))
        }
    }
    const sortedIndices = Array.from(rowIndices).sort((a, b) => a - b)

    const rows = sortedIndices.map((idx) =>
        columns.map((col) => statsJson[col]?.[String(idx)] ?? null)
    )

    return { columns, rows }
}
