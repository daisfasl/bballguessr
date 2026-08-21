from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models import Player
from backend.schemas import GuessResponse, GameStateResponse, RoundStatsResponse, RevealedPlayer
from typing import Literal
import secrets 
import string
router = APIRouter(prefix= "/api/game")

# dict of all currently running games
sessions = dict()

@router.post("/start")
def start_game(preset: Literal["legends", "all_stars", "everyone", "custom"] | None = None,
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

# desc: resolve preset/custom query params into a list of sqlalchemy filter clauses
def build_gamemode_filters(preset, min_career_length, min_allstar_count, min_allnba_count, start_year_min, start_year_max):
    filters = []
    if preset == "legends":
        filters.append(Player.allstar_count >= 5)
    elif preset == "all_stars":
        filters.append(Player.allstar_count >= 1)
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

# desc: build+store a session dict from an already-fetched list of Player rows, returns the game_id
def create_session(players) -> str:
    players = jsonable_encoder(players)
    res = {"current_score":0,
           "current_round":1,
           "game_over" : False}
    for i, rnd in enumerate(players):
        rnd["guesses_remaining"] = 3
        res[str(i+1)] = rnd # BEWARE: ROUND NUMS IN STR!!!
    game_id = generate_game_id()

    while game_id in sessions:
        game_id = generate_game_id()

    sessions[game_id] = res

    return game_id

@router.get("/sessions")
def get_sessions():
    return sessions

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
    game = sessions.get(game_id, None)
    if game:
        if game["game_over"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail= "game associated with game_id is completed")
        round_num = str(game.get("current_round"))
        game[round_num]["guesses_remaining"] -= 1
        guesses_remaining = game[round_num]["guesses_remaining"]
        round_player = game[round_num]

        if round_player.get("basketball_reference_id", None) == basketball_reference_id:
            game["current_score"] += guesses_remaining + 1
            revealed_player = RevealedPlayer(name=round_player["name"],
                                             img_url=round_player.get("img_url"),
                                             basketball_reference_id=round_player["basketball_reference_id"])
            if game["current_round"] == 5:
                game["game_over"] = True
            else:
                guesses_remaining = 3
                game["current_round"] += 1
            return GuessResponse(last_guess=True,
                                 current_score= game["current_score"],
                                 current_round=game["current_round"],
                                 guesses_remaining=guesses_remaining,
                                 game_over=game["game_over"],
                                 revealed_player=revealed_player)
        else:
            revealed_player = None
            if guesses_remaining == 0:
                revealed_player = RevealedPlayer(name=round_player["name"],
                                                 img_url=round_player.get("img_url"),
                                                 basketball_reference_id=round_player["basketball_reference_id"])
                if game["current_round"] == 5:
                    game["game_over"] = True
                else:
                    game["current_round"] += 1
            return GuessResponse(last_guess=False,
                                 current_score= game["current_score"],
                                 current_round=game["current_round"],
                                 guesses_remaining=guesses_remaining,
                                 game_over=game["game_over"],
                                 revealed_player=revealed_player)
    else:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND,
                            detail= "unable to find game_id in sessions")

def generate_game_id(length = 6):
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
