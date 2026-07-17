import type {GuessResponse, GameStateResponse, RoundStatsResponse, AutocompleteResponse} from "./types"

const BASE = "/api"

export async function startGame(): Promise<string> {
  const res = await fetch(`${BASE}/game/start`, { method: "POST" })
  if (!res.ok) {
      throw new Error()
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

export async function getRoundStats(gameId: string, round: number): Promise<RoundStatsResponse> {
  const res = await fetch(`${BASE}/game/${gameId}/${round}`)
  if (!res.ok) {
      throw new Error()
  }
  return await res.json() as RoundStatsResponse
}

export async function guessPlayer(gameId: string, round: number, playerId: string): Promise<GuessResponse> {
  const res = await fetch(`${BASE}/game/${gameId}/${round}/guess/${playerId}`, { method: "POST" })
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
