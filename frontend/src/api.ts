import type {GuessResponse, GameStateResponse, RoundStatsResponse, AutocompleteResponse, GameFilters} from "./types"

const BASE = "http://localhost:8000/api"

// filters is optional — omitting it (or preset "everyone") pulls 5 fully-random players, same as before.
export async function startGame(filters?: GameFilters): Promise<string> {
  const params = new URLSearchParams()
  if (filters) {
      params.set("preset", filters.preset)
      if (filters.min_career_length !== undefined) params.set("min_career_length", String(filters.min_career_length))
      if (filters.min_allstar_count !== undefined) params.set("min_allstar_count", String(filters.min_allstar_count))
      if (filters.min_allnba_count !== undefined) params.set("min_allnba_count", String(filters.min_allnba_count))
      if (filters.start_year_min !== undefined) params.set("start_year_min", String(filters.start_year_min))
      if (filters.start_year_max !== undefined) params.set("start_year_max", String(filters.start_year_max))
  }
  const qs = params.toString()
  const res = await fetch(`${BASE}/game/start${qs ? `?${qs}` : ""}`, { method: "POST" })
  if (!res.ok) {
      // over-filtered custom pools come back as 422 with a {"detail": "..."} body — surface it to the caller
      let detail: string | undefined
      try {
          const body = await res.json() as { detail?: string }
          detail = body?.detail
      } catch {
          // non-JSON error body — fall through to a bare Error
      }
      throw new Error(detail)
  }
  return await res.json() as string
}

export async function getGameState(gameId: string): Promise<GameStateResponse> {
  const res = await fetch(`${BASE}/game/${gameId}`)
  if (!res.ok) {
      throw new Error()
  }
  return await res.json() as GameStateResponse
}

export async function getRoundStats(gameId: string): Promise<RoundStatsResponse> {
  const res = await fetch(`${BASE}/game/${gameId}/stat_table`)
  if (!res.ok) {
      throw new Error()
  }
  return await res.json() as RoundStatsResponse
}

export async function guessPlayer(gameId: string, playerId: string): Promise<GuessResponse> {
  const res = await fetch(`${BASE}/game/${gameId}/guess/${playerId}`, { method: "POST" })
  if (!res.ok) {
      throw new Error()
  }
  return await res.json() as GuessResponse
}

export async function autocompletePlayers(query: string): Promise<AutocompleteResponse> {
  const res = await fetch(`${BASE}/players/?q=${encodeURIComponent(query)}`)
  if (!res.ok) {
      throw new Error()
  }
  return await res.json() as AutocompleteResponse
}
