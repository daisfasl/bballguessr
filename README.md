# bballguessr

Guess the NBA player from their career stat line.

**Play at [bballguessr.com](https://bballguessr.com)**

![bballguessr wordmark beside a halftone basketball](frontend/public/og.png)

## How to play

Each game is five rounds. Every round shows one player's full per-season stats table from
Basketball-Reference, with the name hidden. Teams, positions and awards are all visible.

- You get three guesses per round. Points are 3, 2 or 1 depending on which guess gets it, for a
  maximum of 15.
- A wrong guess unlocks a hint: the player's initials after the first, then a blank for every
  letter of their name after the second.
- If you're stuck, give up to see the answer and move on with no points.
- After each round, the reveal shows the player's photo, plus an optional About panel with
  their Wikipedia summary and a link to highlights on YouTube.

Search by first name, last name or part of each ("leb jam"). Accents and punctuation don't
matter, so `jokic` finds Nikola Jokić and `oneal` finds Shaquille O'Neal.

### Modes

| Mode | Player pool |
|---|---|
| Curated (default) | 469 hand-picked players, from superstars to well-known role players, mostly from the 1990s to now |
| All-Stars | Anyone with at least one All-Star selection |
| Legends | Five or more All-Star selections |
| Everyone | All ~5,400 players in the database. Very hard. |
| Custom | Your own minimums for career length, All-Star and All-NBA selections, plus a debut-year range |

## Running it locally

You need Python 3, Node and a Postgres database.

### Backend

Create a `.env` file in the repo root:

```
DATABASE_URL=postgresql://user:password@host/dbname
FRONTEND_URL=http://localhost:5173
```

`FRONTEND_URL` is the origin allowed by CORS. `http://localhost:5173` is always allowed, so in
production set it to `https://bballguessr.com`.

```sh
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# backend/database.py imports `models` directly, so commands run from the repo root need backend/ on the path
export PYTHONPATH=backend

python -m backend.database                  # create the players table
python -m backend.scraper.db_scrape_runner  # scrape every player (slow, see below)

cd backend && uvicorn main:app --reload     # API on http://localhost:8000
```

The scraper waits 3.2 seconds between requests to stay within Basketball-Reference's rate
limits, so a full run takes several hours.

After scraping, run the scripts that fill the derived columns (same shell, with `PYTHONPATH` set):

```sh
python -m backend.scripts.compute_notability     # All-Star / All-NBA counts
python -m backend.scripts.sync_curated           # curated flag from backend/data/curated_players.txt
python -m backend.scripts.sync_wikipedia_titles  # Wikipedia article for each player
```

### Frontend

```sh
cd frontend
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm install
npm run dev     # http://localhost:5173
```

`npm run build` type-checks and builds; `npm run lint` runs oxlint.

## How it works

**Stack:** React 19, TypeScript and Vite on the frontend; FastAPI, SQLAlchemy and Pydantic on the
backend; Postgres (hosted on Neon) for storage. The frontend is deployed on Vercel.

- **Stats are stored as scraped.** Each player's table is one JSONB column in
  `{ column: { rowIndex: value } }` form. The frontend pivots it back into rows in
  Basketball-Reference's column order, including traded-season team splits and "Did not play"
  notes.
- **Game modes are cheap queries.** A script parses each player's awards into `allstar_count` and
  `allnba_count` columns once, so starting a game filters on plain integer columns instead of
  digging through JSON.
- **The curated list is a text file.** `backend/data/curated_players.txt` is the source of truth,
  synced to a boolean column, so changes show up as readable diffs.
- **Hints never leak the answer.** The server works out hints from the number of wrong guesses
  and only sends the ones that have been earned. The player's name never reaches the browser
  before the reveal.
- **Wikipedia links come from Wikidata.** One SPARQL query maps every Basketball-Reference ID
  (Wikidata property P2685) to its English Wikipedia article. The browser then fetches the summary
  straight from Wikipedia's API when someone opens the About panel.
- **Autocomplete runs from memory.** The API keeps a normalized index of all ~5,400 names and
  ranks matches by All-Star selections, so short searches like `james` lead with LeBron. Restart
  the API after a scrape so it picks up new players.
- **Game sessions are in memory.** Games live in a dictionary on the API server, so they are lost
  on restart, and the API needs a single long-running process rather than serverless functions.

## Credits

Stats and headshots come from [Basketball-Reference.com](https://www.basketball-reference.com),
used for non-commercial purposes. Player summaries come from
[Wikipedia](https://en.wikipedia.org) under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This project isn't affiliated with
or endorsed by Basketball-Reference, Wikipedia or the NBA.
