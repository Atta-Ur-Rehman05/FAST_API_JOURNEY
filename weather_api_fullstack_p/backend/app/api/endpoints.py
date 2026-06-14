from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.api.deps import get_current_user
from app.core import security
from app.models import models
from app.schemas import schemas
from app.services import weather_service

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Welcome to the Weather API!"}

@router.post("/users/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/favorites/", response_model=schemas.FavoriteCityResponse)
def add_favorite_city(city: schemas.FavoriteCityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_city = models.FavoriteCity(city=city.city, user_id=current_user.id)
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city

@router.get("/favorites/", response_model=list[schemas.FavoriteCityResponse])
def get_favorite_cities(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cities = db.query(models.FavoriteCity).filter(models.FavoriteCity.user_id == current_user.id).all()
    return cities

@router.post("/weather/search/")
def search_weather(city: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    weather_data = weather_service.get_weather_data(city)
    
    # log to search history
    history_entry = models.SearchHistory(city=weather_data["city"], user_id=current_user.id)
    db.add(history_entry)
    db.commit()
    
    return weather_data

@router.get("/history/", response_model=list[schemas.SearchHistoryResponse])
def get_search_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    history = db.query(models.SearchHistory).filter(models.SearchHistory.user_id == current_user.id).all()
    return history
