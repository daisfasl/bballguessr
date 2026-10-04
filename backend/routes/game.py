from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from database import get_db
from models import Player
from schemas import GuessResponse, GameStateResponse, RoundStatsResponse, RevealedPlayer
from typing import Literal
import secrets 
import string
router = APIRouter(prefix= "/api/game")

# dict of all currently running games
sessions = dict()

@router.post("/start")
def start_game(preset: Literal["legends", "all_stars", "everyone", "custom", "curated"] | None = None,
               min_career_length: int | None = None,
               min_allstar_count: int | None = None,
               min_allnba_count: int | None = None,
               start_year_min: int | None = None,
               start_year_max: int | None = None,
               db: Session = Depends(get_db)): # returns 5 players from db
    filters = build_gamemode_filters(preset,
                                     min_career_length,
                                     min_allstar_count,
                                     min_allnba_count,
                                     start_year_min,
                                     start_year_max)

    count_stmt = select(func.count()).select_from(Player).where(*filters)
    matching_count = db.scalar(count_stmt)
    if matching_count < 5:
        raise HTTPException(status_code = 422,
                            detail = f"Not enough players match these filters (found {matching_count}). Loosen your criteria.")

    stmt = select(Player).where(*filters).order_by(func.random()).limit(5)
    players = db.scalars(stmt).all()

    return create_session(players)

# resolve preset/custom query params into a list of sqlalchemy filter clauses
def build_gamemode_filters(preset, min_career_length, min_allstar_count, min_allnba_count, start_year_min, start_year_max):
    filters = []
    if preset == "legends":
        filters.append(Player.allstar_count >= 5)
    elif preset == "all_stars":
        filters.append(Player.allstar_count >= 1)
    elif preset == "curated":
        filters.append(Player.curated == True)
    elif preset == "custom":
        if min_career_length is not None:
            filters.append(Player.career_length >= min_career_length)
        if min_allstar_count is not None:
            filters.append(Player.allstar_count >= min_allstar_count)
        if min_allnba_count is not None:
            filters.append(Player.allnba_count >= min_allnba_count)
        if start_year_min is not None:
            filters.append(Player.career_start_year >= start_year_min)
        if start_year_max is not None:
            filters.append(Player.career_start_year <= start_year_max)
    # preset == "everyone" (or no preset given) -> no filter, pull from all players
    return filters

# build+store a session dict from an already-fetched list of Player rows, returns the game_id
def create_session(players) -> str:
    players = jsonable_encoder(players)
    res = {"current_score":0,
           "current_round":1,
           "game_over" : False}
    for i, rnd in enumerate(players):
        rnd["guesses_remaining"] = 3
        rnd["guessed_ids"] = []
        res[str(i+1)] = rnd # BEWARE: ROUND NUMS IN STR!!!
    game_id = generate_game_id()

    while game_id in sessions:
        game_id = generate_game_id()

    sessions[game_id] = res

    return game_id

@router.get("/{game_id}")
def get_game_state(game_id: str):
    game = sessions.get(game_id, None)
    if game:
        curr_round =game.get("current_round")
        return GameStateResponse(current_score= game.get("current_score"),
                                 current_round= curr_round,
                                 guesses_remaining= game[str(curr_round)].get("guesses_remaining"),
                                 game_over= game.get("game_over"))
    else:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND,
                            detail= "unable to find game_id in sessions")

@router.get("/{game_id}/stat_table")
def get_round_stats(game_id: str):
    game = sessions.get(game_id, None)
    if game:
        curr_round = str(game.get("current_round"))
        return RoundStatsResponse(stats_json=game[curr_round]["stats_json"])
    else:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND,
                            detail= "unable to find game_id in sessions")


@router.post("/{game_id}/guess/{basketball_reference_id}")
def guess(game_id: str, basketball_reference_id: str):
    game = get_active_game(game_id)
    round_player = game[str(game["current_round"])]

    if basketball_reference_id in round_player["guessed_ids"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail= "player already guessed this round")
    round_player["guessed_ids"].append(basketball_reference_id)
    round_player["guesses_remaining"] -= 1
    guesses_remaining = round_player["guesses_remaining"]

    if round_player["basketball_reference_id"] == basketball_reference_id:
        game["current_score"] += guesses_remaining + 1
        return end_round(game, last_guess=True)
    if guesses_remaining == 0:
        return end_round(game, last_guess=False)
    return GuessResponse(last_guess=False,
                         current_score= game["current_score"],
                         current_round=game["current_round"],
                         guesses_remaining=guesses_remaining,
                         game_over=game["game_over"])

# give up on the current round: reveal the player, no points
@router.post("/{game_id}/skip")
def skip(game_id: str):
    game = get_active_game(game_id)
    return end_round(game, last_guess=False)

def get_active_game(game_id: str) -> dict:
    game = sessions.get(game_id, None)
    if not game:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND,
                            detail= "unable to find game_id in sessions")
    if game["game_over"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail= "game associated with game_id is completed")
    return game

# reveal the current round's player and advance to the next round (or end the game after round 5)
def end_round(game: dict, last_guess: bool) -> GuessResponse:
    round_player = game[str(game["current_round"])]
    revealed_player = RevealedPlayer(name=round_player["name"],
                                     img_url=round_player.get("img_url"),
                                     basketball_reference_id=round_player["basketball_reference_id"])
    if game["current_round"] == 5:
        game["game_over"] = True
        guesses_remaining = round_player["guesses_remaining"]
    else:
        game["current_round"] += 1
        guesses_remaining = game[str(game["current_round"])]["guesses_remaining"]
    return GuessResponse(last_guess=last_guess,
                         current_score= game["current_score"],
                         current_round=game["current_round"],
                         guesses_remaining=guesses_remaining,
                         game_over=game["game_over"],
                         revealed_player=revealed_player)

def generate_game_id(length = 6):
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
