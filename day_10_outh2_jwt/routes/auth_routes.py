from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from auth.dependencies import get_current_user
from auth.jwt_handler import create_access_token
from auth.security import verify_password, hash_password
from database.fack_db import fake_users_db
from schema.auth_schema import token as TokenModel, user as UserModel

router = APIRouter(tags=["auth"])

@router.post("/login", response_model=TokenModel)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db_user = fake_users_db.get(form_data.username)
    if db_user is None or not verify_password(form_data.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": db_user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=TokenModel)
def register(user: UserModel):
    if user.username in fake_users_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    hashed_password = hash_password(user.password)
    fake_users_db[user.username] = {"username": user.username, "hashed_password": hashed_password}
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserModel)
def read_current_user(current_user: dict = Depends(get_current_user)):
    return UserModel(username=current_user["username"], password="")
