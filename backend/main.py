from fastapi import FastAPI
from backend.routes.players import router as player_router
from backend.routes.game import router as game_router
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Backend for fastapp"}

app.include_router(player_router)
app.include_router(game_router)
