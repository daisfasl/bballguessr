import type { CustomFilterValues } from '../types'

interface CustomFiltersProps {
    values: CustomFilterValues
    onChange: (values: CustomFilterValues) => void
}

// bounds sourced from the current player pool (see CLAUDE.md / plan notes)
const CAREER_LENGTH_BOUNDS = { min: 1, max: 23 }
const ALLSTAR_BOUNDS = { min: 0, max: 19 }
const ALLNBA_BOUNDS = { min: 0, max: 15 }
const YEAR_BOUNDS = { min: 1947, max: 2026 }

export function CustomFilters({ values, onChange }: CustomFiltersProps) {
    const set = <K extends keyof CustomFilterValues>(key: K, raw: string, bounds: { min: number; max: number }) => {
        const parsed = Number(raw)
        const clamped = Number.isNaN(parsed) ? bounds.min : Math.min(bounds.max, Math.max(bounds.min, parsed))
        onChange({ ...values, [key]: clamped })
    }

    return (
        <div className="CustomFilters">
            <div className="CustomFilters-field">
                <label className="CustomFilters-label" htmlFor="min_career_length">
                    Minimum career length, in seasons ({CAREER_LENGTH_BOUNDS.min}–{CAREER_LENGTH_BOUNDS.max})
                </label>
                <input
                    id="min_career_length"
                    name="min_career_length"
                    type="number"
                    inputMode="numeric"
                    min={CAREER_LENGTH_BOUNDS.min}
                    max={CAREER_LENGTH_BOUNDS.max}
                    value={values.min_career_length}
                    onChange={(e) => set('min_career_length', e.target.value, CAREER_LENGTH_BOUNDS)}
                />
            </div>

            <div className="CustomFilters-field">
                <label className="CustomFilters-label" htmlFor="min_allstar_count">
                    Minimum All-Star seasons ({ALLSTAR_BOUNDS.min}–{ALLSTAR_BOUNDS.max})
                </label>
                <input
                    id="min_allstar_count"
                    name="min_allstar_count"
                    type="number"
                    inputMode="numeric"
                    min={ALLSTAR_BOUNDS.min}
                    max={ALLSTAR_BOUNDS.max}
                    value={values.min_allstar_count}
                    onChange={(e) => set('min_allstar_count', e.target.value, ALLSTAR_BOUNDS)}
                />
            </div>

            <div className="CustomFilters-field">
                <label className="CustomFilters-label" htmlFor="min_allnba_count">
                    Minimum All-NBA seasons ({ALLNBA_BOUNDS.min}–{ALLNBA_BOUNDS.max})
                </label>
                <input
                    id="min_allnba_count"
                    name="min_allnba_count"
                    type="number"
                    inputMode="numeric"
                    min={ALLNBA_BOUNDS.min}
                    max={ALLNBA_BOUNDS.max}
                    value={values.min_allnba_count}
                    onChange={(e) => set('min_allnba_count', e.target.value, ALLNBA_BOUNDS)}
                />
            </div>

            <div className="CustomFilters-field CustomFilters-era">
                <span className="CustomFilters-label" id="era-label">
                    Era, by the year their career started ({YEAR_BOUNDS.min}–{YEAR_BOUNDS.max})
                </span>
                <div className="CustomFilters-eraInputs" role="group" aria-labelledby="era-label">
                    <input
                        aria-label="Earliest career start year"
                        name="start_year_min"
                        type="number"
                        inputMode="numeric"
                        min={YEAR_BOUNDS.min}
                        max={YEAR_BOUNDS.max}
                        value={values.start_year_min}
                        onChange={(e) => set('start_year_min', e.target.value, YEAR_BOUNDS)}
                    />
                    <span className="CustomFilters-dash" aria-hidden="true">–</span>
                    <input
                        aria-label="Latest career start year"
                        name="start_year_max"
                        type="number"
                        inputMode="numeric"
                        min={YEAR_BOUNDS.min}
                        max={YEAR_BOUNDS.max}
                        value={values.start_year_max}
                        onChange={(e) => set('start_year_max', e.target.value, YEAR_BOUNDS)}
                    />
                </div>
            </div>
        </div>
    )
}
