// api response types

export interface RevealedPlayer {
    name: string
    img_url: string | null
    basketball_reference_id: string
}

export interface GuessResponse {
    last_guess: boolean
    current_score: number
    current_round: 1 | 2 | 3 | 4 | 5
    guesses_remaining: 0 | 1 | 2 | 3
    game_over: boolean
    revealed_player: RevealedPlayer | null
}

export interface GameStateResponse {
    current_score: number
    current_round: 1 | 2 | 3 | 4 | 5
    guesses_remaining: 0 | 1 | 2 | 3
    game_over: boolean
}

// stats table from current_round
export interface RoundStatsResponse {
    stats_json: Record<string, Record<string, string | null>>
}

export interface PlayerMatch {
    name: string
    basketball_reference_id: string
}

export interface AutocompleteResponse {
    players: PlayerMatch[]
}

// gamemode selection, sent as query params to POST /api/game/start
export type GamePreset = 'legends' | 'all_stars' | 'everyone' | 'custom'

export interface GameFilters {
    preset: GamePreset
    min_career_length?: number
    min_allstar_count?: number
    min_allnba_count?: number
    start_year_min?: number
    start_year_max?: number
}

// controlled values for the CustomFilters panel — always fully populated (floor values act as "no filter")
export interface CustomFilterValues {
    min_career_length: number
    min_allstar_count: number
    min_allnba_count: number
    start_year_min: number
    start_year_max: number
}
