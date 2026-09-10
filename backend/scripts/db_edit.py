from backend.database import get_db_context_manager
from backend.models import Player
from sqlalchemy import update


stmt = update(Player).where(Player.career_start_year == 1900).values(career_start_year = 2000)
with get_db_context_manager() as db:
    db.execute(stmt)

print("successful!")
