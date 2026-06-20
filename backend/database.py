from sqlalchemy import create_engine
import psycopg2
from dotenv import load_dotenv
import os

# load hidden DATABASE_URL from .env file
load_dotenv() 
DB_URL = os.getenv("DATABASE_URL")

def save_player(player_name, data):
    pass

def get_connection():
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")

def initialize_database():
    pass
if __name__ == "__main__":
    initialize_database()
