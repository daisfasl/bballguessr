from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import JSONB

Base = declarative_base()

# TABLE DEFINITIONS:
class Player(Base):
    __tablename__ = "players"
    stats_json = Column(JSONB,
                        nullable = False)
    career_length = Column(Integer,
                           nullable = False)
    img_url = Column(String(255),
                     unique = True)
    career_start_year = Column(Integer,
                               nullable = False)
    name = Column(String(255),
                  nullable = False)
    basketball_reference_id = Column(String(100), 
                                     unique = True,
                                     nullable = False)

