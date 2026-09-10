import csv
import sys
from backend.database import engine
from backend.models import Player
from sqlalchemy.orm import Session

TIER_ORDER = ["modern_star", "classic", "modern_role"]

# desc: True if any cell in the player's Awards column is truthy (non-empty)
def has_award(stats_json: dict) -> bool:
    awards = stats_json.get("Awards") if stats_json else None
    if not awards:
        return False
    return any(bool(cell) for cell in awards.values())

# desc: sum of games played across the player's G column, skipping non-numeric cells
def total_games(stats_json: dict) -> int:
    games = stats_json.get("G") if stats_json else None
    if not games:
        return 0
    total = 0.0
    for cell in games.values():
        try:
            total += float(cell)
        except (TypeError, ValueError):
            continue
    return round(total)

# desc: max ending year across the player's Season column, e.g. "1999-00" -> 2000, "2013-14" -> 2014
def last_year(stats_json: dict):
    seasons = stats_json.get("Season") if stats_json else None
    if not seasons:
        return None
    years = []
    for cell in seasons.values():
        if not cell or "-" not in cell:
            continue
        first_part, second_part = cell.split("-", 1)
        if len(first_part) != 4 or len(second_part) != 2 or not first_part.isdigit() or not second_part.isdigit():
            continue
        century = first_part[:2]
        year = int(century + second_part)
        # handle century rollover, e.g. "1999-00" -> 2000
        if second_part < first_part[2:]:
            year += 100
        years.append(year)
    return max(years) if years else None

# desc: assign exactly one tier (or None if the player is excluded) based on the locked nets
def assign_tier(career_start_year, seasons, allstar_count, allnba_count):
    if career_start_year is None or career_start_year >= 2027:
        return None
    if career_start_year >= 1990 and (allstar_count >= 1 or allnba_count >= 1):
        return "modern_star"
    if career_start_year < 1990 and (allstar_count >= 2 or allnba_count >= 1):
        return "classic"
    if career_start_year >= 1998 and allstar_count == 0 and allnba_count == 0 and seasons >= 8:
        return "modern_role"
    return None

def gen_candidates():
    rows = []
    with Session(engine) as db:
        players = db.query(Player).all()
        for player in players:
            stats_json = player.stats_json or {}
            allstar_count = player.allstar_count or 0
            allnba_count = player.allnba_count or 0
            seasons = player.career_length or 0

            tier = assign_tier(player.career_start_year, seasons, allstar_count, allnba_count)
            if tier is None:
                continue

            rows.append({
                "name": player.name,
                "basketball_reference_id": player.basketball_reference_id,
                "career_start_year": player.career_start_year,
                "seasons": seasons,
                "allstar_count": allstar_count,
                "allnba_count": allnba_count,
                "has_award": has_award(stats_json),
                "total_games": total_games(stats_json),
                "last_year": last_year(stats_json),
                "tier": tier,
            })

    tier_rank = {tier: i for i, tier in enumerate(TIER_ORDER)}
    rows.sort(key=lambda r: (
        tier_rank[r["tier"]],
        -r["allstar_count"],
        -r["allnba_count"],
        -r["total_games"],
    ))
    return rows

def main():
    rows = gen_candidates()
    fieldnames = ["name", "basketball_reference_id", "career_start_year", "seasons",
                  "allstar_count", "allnba_count", "has_award", "total_games", "last_year", "tier"]
    writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

if __name__ == "__main__":
    main()
