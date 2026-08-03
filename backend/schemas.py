from pydantic import BaseModel, Json, Field
from datetime import datetime
from typing import Literal, Annotated, List


class Player(BaseModel):
    basketball_reference_id: str
    name: str
    id: int
    created_at: datetime | None
    updated_at: datetime | None
    stats_json: Json
    career_length: int
    img_url: str | None
    career_start_year: int

class Message(BaseModel):
    message: str

class RevealedPlayer(BaseModel):
    name: str
    img_url: str | None
    basketball_reference_id: str

class GuessResponse(BaseModel):
    last_guess: bool
    current_score: int
    current_round: Literal[1,2,3,4,5]
    guesses_remaining: Literal[0,1,2,3]
    game_over: bool
    revealed_player: RevealedPlayer | None = None

class GameStateResponse(BaseModel):
    current_score: int
    current_round: Literal[1,2,3,4,5]
    guesses_remaining: Literal[0,1,2,3]
    game_over: bool


class RoundStatsResponse(BaseModel):
    stats_json: dict

class PlayerMatch(BaseModel):
    name: str
    basketball_reference_id: str

class AutocompleteResponse(BaseModel):
    players: Annotated[List[PlayerMatch], Field(min_length = 0, max_length = 5)]
