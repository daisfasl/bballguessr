from fastapi import APIRouter, Depends
from backend.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix= "/api/players")

@router.get("/{bball_ref_id}")
def get_player(bball_ref_id):
    pass

@router.get("/")
def player_auto_complete(q: str| None = None):
    pass
