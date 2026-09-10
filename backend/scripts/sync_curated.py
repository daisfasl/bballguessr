import sys
from pathlib import Path
from backend.database import engine, get_db_context_manager
from backend.models import Player
from sqlalchemy import text, select, update, func

SEED_FILE = Path(__file__).resolve().parent.parent / "data" / "curated_players.txt"

# add curated column if it doesn't already exist
# (no Alembic in this repo -- create_all() won't ALTER an existing table)
def add_column():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE players ADD COLUMN IF NOT EXISTS curated BOOLEAN DEFAULT FALSE"))
        conn.commit()

# desc: parse the seed file into a list of basketball_reference_ids
# ignores blank lines and everything from '#' onward on each line
def parse_seed_file(path: Path) -> list[str]:
    ids = []
    with open(path) as f:
        for line in f:
            line = line.split("#", 1)[0].strip()
            if not line:
                continue
            ids.append(line)
    return ids

# desc: idempotent full sync -- curated=True for every id in the seed file that exists in players,
# curated=False for everyone else. Prints unknown ids (in the file but not in the db) and the
# final count of curated players.
def sync():
    seed_ids = parse_seed_file(SEED_FILE)
    seed_ids_set = set(seed_ids)

    with get_db_context_manager() as db:
        existing_ids = set(db.scalars(select(Player.basketball_reference_id)).all())
        unknown_ids = sorted(seed_ids_set - existing_ids)

        db.execute(update(Player).values(curated=Player.basketball_reference_id.in_(seed_ids_set)))

        curated_count = db.scalar(select(func.count()).select_from(Player).where(Player.curated == True))

    for unknown_id in unknown_ids:
        print(f"unknown id: {unknown_id}")

    print(f"curated = TRUE for {curated_count} players")

if __name__ == "__main__":
    if not SEED_FILE.exists():
        print(f"seed file not found: {SEED_FILE}", file=sys.stderr)
        sys.exit(1)
    add_column()
    sync()
