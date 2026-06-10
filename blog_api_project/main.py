# this file contain main fastapi code
from datetime import timedelta
from database import engine, get_db
from sqlalchemy.orm import Session
import models
from models import Base, blogs, users
from fastapi import FastAPI, Depends, HTTPException, status
import schemas
from auth import create_access_token, get_current_user, pwd_context, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi.security import OAuth2PasswordRequestForm

app = FastAPI()

Base.metadata.create_all(bind=engine)

# login route
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(users).filter(users.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}

# register route
@app.post("/register", response_model=schemas.user_response)
async def register(user: schemas.user_create, db: Session = Depends(get_db)):
    db_user = db.query(users).filter(users.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = users(username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user





# home route
@app.get("/")
async def root():
    return {"message": "Welcome to the Blog API"}


# create blog(protected)
@app.post("/blogs", response_model=schemas.blog_response)
async def create_blog(blog: schemas.create_blogs, db: Session = Depends(get_db), current_user: users = Depends(get_current_user)):
   new_blog = models.blogs(
    title = blog.title,
    content = blog.content,
    owner_id = current_user.id
   )
   db.add(new_blog)
   db.commit()
   db.refresh(new_blog)
   return new_blog


# get all blogs
@app.get("/blogs", response_model=list[schemas.blog_response])
async def get_blogs(db: Session = Depends(get_db)):
    return db.query(blogs).all()


# get blog by id
@app.get("/blogs/{id}", response_model=schemas.blog_response)
async def get_blog(id: int, db: Session = Depends(get_db)):
    blog = db.query(blogs).filter(blogs.id == id).first()
    if blog is None:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog


# update blog(protected)
@app.put("/blogs/{id}", response_model=schemas.blog_response)
async def update_blog(id: int, blog: schemas.create_blogs, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    db_blog = db.query(blogs).filter(blogs.id == id).first()
    if db_blog is None:
        raise HTTPException(status_code=404, detail="Blog not found")
    db_blog.title = blog.title
    db_blog.content = blog.content
    db.commit()
    db.refresh(db_blog)
    return db_blog

 
# delete blog(protected)
@app.delete("/blogs/{id}")
async def delete_blog(id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    db_blog = db.query(blogs).filter(blogs.id == id).first()
    if db_blog is None:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(db_blog)
    db.commit()
    return {"message": "Blog deleted successfully"}
