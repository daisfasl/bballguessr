from pydantic import BaseModel, Json
from datetime import datetime
from typing import Literal

from backend.models import Base

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

class GuessResponse(BaseModel):
    last_guess: bool
    current_score: int
    current_round: Literal[1,2,3,4,5]
    guesses_remaining: Literal[0,1,2,3]
    game_over: bool

class GameStateResponse(BaseModel):
    current_score: int
    current_round: Literal[1,2,3,4,5]
    guesses_remaining: Literal[0,1,2,3]
    game_over: bool
