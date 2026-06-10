# THIS FILE CONTAIN MODELS I MEAN TABLES FOR DATABASE

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))

    blogs = relationship("blogs", back_populates="owner")


class blogs(Base):
    __tablename__ = "blogs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    content = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("users", back_populates="blogs")