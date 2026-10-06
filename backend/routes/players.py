from fastapi import APIRouter, Depends
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from models import Player
from schemas import AutocompleteResponse, PlayerMatch
import re
import unicodedata

router = APIRouter(prefix= "/api/players")

MAX_RESULTS = 5

# desc: lowercase, strip accents and drop apostrophes/periods, split on anything else
# "Nikola Jokić" -> ["nikola", "jokic"], "Shaquille O'Neal" -> ["shaquille", "oneal"], "Karl-Anthony" -> ["karl", "anthony"]
def normalize_words(text: str) -> list[str]:
    stripped = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    stripped = re.sub(r"['’.]", "", stripped.lower())
    return [w for w in re.split(r"[^a-z0-9]+", stripped) if w]

# ~5k players, so the whole name list lives in memory (loaded on first search; restart the API after a scrape)
# rows: (normalized words, name, basketball_reference_id, notability sort key)
_index: list[tuple[list[str], str, str, tuple[int, int]]] | None = None

def get_index(db: Session):
    global _index
    if _index is None:
        rows = db.execute(select(Player.name, Player.basketball_reference_id,
                                 Player.allstar_count, Player.career_length)).all()
        _index = [(normalize_words(name), name, bref_id, (allstar or 0, career or 0))
                  for name, bref_id, allstar, career in rows]
    return _index

# desc: every typed word must prefix a different word of the name, in any order ("leb jam", "james", "jokic")
def matches(query_words: list[str], name_words: list[str]) -> bool:
    remaining = list(name_words)
    for q in query_words:
        hit = next((w for w in remaining if w.startswith(q)), None)
        if hit is None:
            return False
        remaining.remove(hit)
    return True

# desc: return <=5 players w/ name AND basketball_reference_id
@router.get("/")
def player_auto_complete(q: str| None = None, db: Session = Depends(get_db)):
    query_words = normalize_words(q or "")
    if not query_words:
        return AutocompleteResponse(players=[])

    hits = [row for row in get_index(db) if matches(query_words, row[0])]
    # notable players before deep cuts, so "james" leads with LeBron rather than every James alphabetically
    hits.sort(key=lambda row: (-row[3][0], -row[3][1], row[1]))
    res = [PlayerMatch(name=name, basketball_reference_id=bref_id) for _, name, bref_id, _ in hits[:MAX_RESULTS]]
    return AutocompleteResponse(players=res)
