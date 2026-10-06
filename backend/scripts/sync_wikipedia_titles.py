from backend.database import engine, get_db_context_manager
from backend.models import Player
from sqlalchemy import text, select, update
from urllib.parse import unquote
import requests

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
# Wikidata asks bots for a descriptive User-Agent with a contact URL
HEADERS = {"Accept": "application/sparql-results+json",
           "User-Agent": "bballguessr/0.1 (https://github.com/daisfasl/bballguessr)"}

# every item with a Basketball Reference NBA player ID (P2685) that has an English Wikipedia article
QUERY = """
SELECT ?bbref ?article WHERE {
  ?item wdt:P2685 ?bbref.
  ?article schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>.
}
"""

# add wikipedia_title column if it doesn't already exist
# (no Alembic in this repo -- create_all() won't ALTER an existing table)
def add_column():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE players ADD COLUMN IF NOT EXISTS wikipedia_title VARCHAR(255)"))
        conn.commit()

# desc: {basketball_reference_id: wikipedia article title} from one Wikidata query
def fetch_titles() -> dict[str, str]:
    response = requests.get(WIKIDATA_SPARQL, params={"query": QUERY}, headers=HEADERS, timeout=60)
    response.raise_for_status()
    titles = {}
    for row in response.json()["results"]["bindings"]:
        # P2685 values carry bbref's letter folder: "j/jamesle01" -> "jamesle01"
        bbref_id = row["bbref"]["value"].split("/")[-1]
        # "https://en.wikipedia.org/wiki/Shaquille_O%27Neal" -> "Shaquille_O'Neal"
        titles[bbref_id] = unquote(row["article"]["value"].rsplit("/wiki/", 1)[1])
    return titles

def backfill(titles: dict[str, str]):
    with get_db_context_manager() as db:
        players = db.execute(select(Player.id, Player.basketball_reference_id)).all()
        # one executemany keyed on primary key instead of a round trip per player
        rows = [{"id": p.id, "wikipedia_title": titles.get(p.basketball_reference_id)} for p in players]
        db.execute(update(Player), rows)
    matched = sum(1 for r in rows if r["wikipedia_title"])
    print(f"Matched {matched} of {len(players)} players to a Wikipedia article")

if __name__ == "__main__":
    add_column()
    backfill(fetch_titles())
