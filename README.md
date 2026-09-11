# 🏀 bballguessr

**Guess the NBA player from their real career stat line.** You're shown a player's full
per-season stats table (scraped from [basketball-reference.com](https://www.basketball-reference.com))
with the name hidden — you get five rounds, three guesses each, and more points for guessing in
fewer tries.

---

## The Game

- **Real data, real stat tables** — ~5,400 players scraped from basketball-reference, each with their
  complete per-season stats stored as JSONB and rendered as a familiar box-score table.
- **Five game modes** driven by the player pool:
  - **Curated** _(default)_ — a hand-picked list of both super popular and moderately recognized players, weighted toward the
    1990s–2020s but has some overlap in other eras.
  - **All-Stars** / **Legends** — everyone with ≥1 / ≥5 All-Star seasons.
  - **Everyone** — all ~5,400 players (hardcore/impossible).
  - **Custom** — set your own filters: minimum career length, minimum All-Star seasons, minimum
    All-NBA seasons, and an era (draft-year) range.
- **Name autocomplete**, per-round reveal (photo + name), and a running score out of 15.
- **Deployed** on a modern serverless-friendly stack (Railway + Vercel + Neon).

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL, hosted on Neon |
| Data pipeline | Python scraper — `requests`, `BeautifulSoup`, `pandas` |
| Hosting | Railway (API) · Vercel (static frontend) · Neon (Postgres) |

## Notable engineering decisions

- **Column-oriented stats → pivoted for display.** Scraped tables are stored as
  `{ column: { rowIndex: value } }` JSONB; the frontend pivots them back into ordered rows using a
  canonical basketball-reference column order.
- **Precomputed notability.** A one-off script parses each player's awards history into
  `allstar_count` / `allnba_count` columns, so game-mode filtering is a cheap indexed query instead
  of scanning JSON at request time.
- **Curated list as data, not code.** The 469-player list lives in a version-controlled seed file
  (`backend/data/curated_players.txt`) and is synced to a boolean `curated` column by a script — easy
  to review and edit in a diff, decoupled from the app.

---

## Data & attribution
Player data is scraped from basketball-reference.com for educational/non-commercial use. This project
is not affiliated with or endorsed by basketball-reference.com or the NBA.
