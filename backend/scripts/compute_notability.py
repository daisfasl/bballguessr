from backend.database import engine, get_db_context_manager
from backend.models import Player
from sqlalchemy import text, select, update

ALLNBA_TOKENS = {"NBA1", "NBA2", "NBA3"}

# add allstar_count/allnba_count columns if they don't already exist
# (no Alembic in this repo -- create_all() won't ALTER an existing table)
def add_columns():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE players ADD COLUMN IF NOT EXISTS allstar_count INTEGER DEFAULT 0"))
        conn.execute(text("ALTER TABLE players ADD COLUMN IF NOT EXISTS allnba_count INTEGER DEFAULT 0"))
        conn.commit()

# desc: parse a player's Awards column (stats_json["Awards"]) into (allstar_count, allnba_count)
def count_accolades(stats_json: dict) -> tuple[int, int]:
    awards = stats_json.get("Awards") if stats_json else None
    if not awards:
        return 0, 0

    allstar_count = 0
    allnba_count = 0
    for cell in awards.values():
        if not cell:
            continue
        tokens = [tok.strip() for tok in cell.split(",")]
        if "AS" in tokens:
            allstar_count += 1
        if ALLNBA_TOKENS.intersection(tokens):
            allnba_count += 1

    return allstar_count, allnba_count

def backfill():
    updated = 0
    with get_db_context_manager() as db:
        players = db.scalars(select(Player)).all()
        for player in players:
            allstar_count, allnba_count = count_accolades(player.stats_json)
            db.execute(update(Player).where(Player.id == player.id).values(
                allstar_count = allstar_count,
                allnba_count = allnba_count))
            updated += 1
    print(f"Backfilled allstar_count/allnba_count for {updated} players")

if __name__ == "__main__":
    add_columns()
    backfill()
