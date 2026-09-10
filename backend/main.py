from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.players import router as player_router
from routes.game import router as game_router
import os
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
if not FRONTEND_URL:
    raise ValueError("No FRONTEND_URL in .env file")
app = FastAPI()

origins = FRONTEND_URL

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
