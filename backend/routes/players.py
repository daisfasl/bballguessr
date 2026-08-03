from fastapi import APIRouter, Depends
from backend.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.models import Player
from backend.schemas import AutocompleteResponse, PlayerMatch

router = APIRouter(prefix= "/api/players")

# desc: return <=5 players w/ name AND basketball_reference_id
@router.get("/")
def player_auto_complete(q: str| None = None, db: Session = Depends(get_db)):
    if not q:
        return AutocompleteResponse(players=[])
    else:
        stmt = select(Player.name, Player.basketball_reference_id).where(Player.name.istartswith(q)).limit(5) # not case sensitive (istartswith)
        rows = db.execute(stmt).all()
        res = [PlayerMatch(name=name, basketball_reference_id=bref_id) for name, bref_id in rows]
        return AutocompleteResponse(players=res)

