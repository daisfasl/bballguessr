from fastapi import APIRouter, Depends
from backend.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.models import Player
from backend.schemas import AutocompleteResponse

router = APIRouter(prefix= "/api/players")

# desc: return <=5 players w/ name AND id
@router.get("/")
def player_auto_complete(q: str| None = None, db: Session = Depends(get_db)):
    if not q:
        return None
    else:
        stmt = select(Player.name, Player.id).where(Player.name.istartswith(q)).limit(5) # not case sensitive (istartswith)
        test = db.execute(stmt).all()
        res = {} 
        for name, id, in test:
            res[name] = id
        return AutocompleteResponse(players=res)

