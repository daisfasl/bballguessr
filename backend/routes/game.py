from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models import Player
from backend.schemas import GuessResponse, GameStateResponse, RoundStatsResponse
from typing import Literal
import secrets 
import string
router = APIRouter(prefix= "/api/game")

# dict of all currently running games
sessions = dict()

@router.post("/start") # add parameters for filtering later...
def start_game(db: Session = Depends(get_db)): # returns 5 players from db
    stmt = select(Player).order_by(func.random()).limit(5)
    players = db.scalars(stmt).all()
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


@router.post("/{game_id}/{round_num}/guess/{basketball_reference_id}")
def guess(game_id: str, basketball_reference_id: str):
    game = sessions.get(game_id, None)
    if game:
        if game["game_over"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail= "game associated with game_id is completed")
        round_num = str(game.get("current_round"))
        game[round_num]["guesses_remaining"] -= 1
        guesses_remaining = game[round_num]["guesses_remaining"]

        if game.get(round_num , None).get("basketball_reference_id", None) == basketball_reference_id:
            game["current_score"] += guesses_remaining + 1
            if game["current_round"] == 5:
                game["game_over"] = True
            else:
                guesses_remaining = 3
                game["current_round"] += 1
            return GuessResponse(last_guess=True,
                                 current_score= game["current_score"],
                                 current_round=game["current_round"],
                                 guesses_remaining=guesses_remaining,
                                 game_over=game["game_over"])
        else:
            if guesses_remaining == 0:
                if game["current_round"] == 5:
                    game["game_over"] = True
                else:
                    game["current_round"] += 1
            return GuessResponse(last_guess=False,
                                 current_score= game["current_score"],
                                 current_round=game["current_round"],
                                 guesses_remaining=guesses_remaining,
                                 game_over=game["game_over"])
    else:
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND,
                            detail= "unable to find game_id in sessions")

def generate_game_id(length = 6):
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
