from fastapi import APIRouter, Depends
from backend.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.models import Player

router = APIRouter(prefix= "/api/players")

# desc: return <=5 players w/ name AND id
@router.get("/")
def player_auto_complete(q: str| None = None, db: Session = Depends(get_db)):
    if not q:
        return None
    else:
        stmt = select(Player.name, Player.id).where(Player.name.istartswith(q)).limit(5) # not case sensitive (istartswith)
        res = db.execute(stmt).all()
        test = {} 
        for name, id, in res:
            test[name] = id
        return test

