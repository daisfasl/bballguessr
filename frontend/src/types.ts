// api response types

export interface GuessResponse {
    last_guess: boolean
    current_score: number
    current_round: 1 | 2 | 3 | 4 | 5
    guesses_remaining: 0 | 1 | 2 | 3
    game_over: boolean
}

export interface GameStateResponse {
    current_score: number
    current_round: 1 | 2 | 3 | 4 | 5
    guesses_remaining: 0 | 1 | 2 | 3
    game_over: boolean
}

// stats table from current_round
export interface RoundStatsResponse {
    stats_json: Record<any,any>
}

export interface AutocompleteResponse {
    players: Record<string, number> // <player_name, sql_id>
}
