from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.players import router as player_router
from backend.routes.game import router as game_router
app = FastAPI()

origins = ["http://localhost:5173"]

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods = ["*"],
        allow_headers = ["*"]
        )

@app.get("/")
async def root():
    return {"message": "Backend for fastapp"}

app.include_router(player_router)
app.include_router(game_router)
