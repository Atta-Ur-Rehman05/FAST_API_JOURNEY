# this file contain the db models

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

# design the table user, favorite_cities, and search_history

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    password = Column(String)
    
    # ORM relationships
    favorite_cities = relationship("FavoriteCity", back_populates="user", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")

class FavoriteCity(Base):
    __tablename__ = "favorite_cities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    city = Column(String, index=True)
    
    # ORM relationship
    user = relationship("User", back_populates="favorite_cities")

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    city = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # ORM relationship
    user = relationship("User", back_populates="search_history")
