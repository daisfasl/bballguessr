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

// columns that read as words, not numbers — left-aligned in the table
export const TEXT_COLUMNS = new Set(["Season", "Team", "Lg", "Pos", "Awards"])

// bbref awards come as one comma-joined string, e.g. "MVP-3,AS,NBA1"
export function splitAwards(raw: string | null): string[] {
    if (!raw) return []
    return raw.split(",").map((a) => a.trim()).filter(Boolean)
}

// bbref puts season notes like "Did not play - other pro league" into a stat column
// with the rest of the row empty; returns that note, or null for a normal stat row
export function rowNote(columns: string[], row: (string | null)[]): string | null {
    for (let i = 0; i < columns.length; i++) {
        const cell = row[i]
        if (!TEXT_COLUMNS.has(columns[i]) && cell && /[a-z]{3,}/i.test(cell)) return cell
    }
    return null
}
