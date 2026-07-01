from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db

router = APIRouter(prefix= "/api/game")

@router.post("/start")
def start_game(db: Session = Depends(get_db())):
    pass
