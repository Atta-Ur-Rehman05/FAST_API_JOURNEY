# this file contain main fastapi code
from database import engine, SessionLocal
from sqlalchemy.orm import Session
import models
from models import Base, blogs
from fastapi import FastAPI, Depends, HTTPException
import schemas

Base.metadata.create_all(bind=engine)
app = FastAPI()

# db dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# home route
@app.get("/")
async def root():
    return {"message": "Welcome to the Blog API"}


# create blog
@app.post("/blogs", response_model=schemas.blog_response)
async def create_blog(blog: schemas.create_blogs, db: Session = Depends(get_db)):
   new_blog = models.blogs(
    title = blog.title,
    content = blog.content
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


# update blog
@app.put("/blogs/{id}", response_model=schemas.blog_response)
async def update_blog(id: int, blog: schemas.create_blogs, db: Session = Depends(get_db)):
    db_blog = db.query(blogs).filter(blogs.id == id).first()
    if db_blog is None:
        raise HTTPException(status_code=404, detail="Blog not found")
    db_blog.title = blog.title
    db_blog.content = blog.content
    db.commit()
    db.refresh(db_blog)
    return db_blog


# delete blog
@app.delete("/blogs/{id}")
async def delete_blog(id: int, db: Session = Depends(get_db)):
    db_blog = db.query(blogs).filter(blogs.id == id).first()
    if db_blog is None:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(db_blog)
    db.commit()
    return {"message": "Blog deleted successfully"}
