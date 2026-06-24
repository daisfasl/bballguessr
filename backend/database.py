from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from models import Base, Player
from contextlib import contextmanager

# load hidden DATABASE_URL from .env file
load_dotenv() 
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("No DB_URL in .env")

# set up sqlalchemy engine(database connection)/sessions
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)
## autoflush = False as in case of crash, wont mess up scraper ##


def save_player(stats_dict, career_length, img_url, career_start_year, name, bball_ref_id):
    stmt = insert(Player).values(
            stats_json = stats_dict,
            career_length = career_length,
            img_url = img_url,
            career_start_year = career_start_year,
            name = name,
            basketball_reference_id = bball_ref_id)
    
    # if theres a conflict, replace columns with new values
    updated_columns = {"name": stmt.excluded.name,
                       "career_start_year": stmt.excluded.career_start_year,
                       "career_length": stmt.excluded.career_length,
                       "img_url": stmt.excluded.img_url,
                       "stats_json": stmt.excluded.stats_json}
    upsert_stmt = stmt.on_conflict_do_update(index_elements = ["basketball_reference_id"],
                                             set_ = updated_columns)
    with get_connection() as db:
        res = db.execute(upsert_stmt)
        return bball_ref_id
    
@contextmanager
def get_connection():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except: 
        session.rollback()
        raise
    finally: 
        session.close()

def initialize_database():
    Base.metadata.create_all(engine)

if __name__ == "__main__":
    initialize_database()
    print("Database initialized!")
