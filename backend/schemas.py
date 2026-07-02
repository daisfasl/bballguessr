from pydantic import BaseModel, Json
from datetime import datetime

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

