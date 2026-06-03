from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import database
import model
import schemas

app = FastAPI()

database.Base.metadata.create_all(bind=database.engine)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/students/", response_model=schemas.StudentRead)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = model.Student(name=student.name, age=student.age)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@app.get("/students/", response_model=list[schemas.StudentRead])
def read_students(db: Session = Depends(get_db)):
    students = db.query(model.Student).all()
    return students


@app.get("/students/{student_id}/", response_model=schemas.StudentRead)
def read_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(model.Student).filter(model.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.put("/students/{student_id}/", response_model=schemas.StudentRead)
def update_student(student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(model.Student).filter(model.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_student.name = student.name
    db_student.age = student.age
    db.commit()
    db.refresh(db_student)
    return db_student


@app.delete("/students/{student_id}/")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(model.Student).filter(model.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted successfully"}

