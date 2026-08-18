from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://admin:qwerty@localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["xyz_university"]
students_collection = db["students"]

class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    student_id: str
    password: str

class StudentResponse(BaseModel):
    id: str
    full_name: str
    email: str
    student_id: str

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.post("/register", response_model=StudentResponse)
async def register_student(
    full_name: str = Form(...),
    email: str = Form(...),
    student_id: str = Form(...),
    password: str = Form(...)
):
    existing = await students_collection.find_one({
        "$or": [{"email": email}, {"student_id": student_id}]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Email or Student ID already registered")
    
    new_student = {
        "full_name": full_name,
        "email": email,
        "student_id": student_id,
        "password": password
    }
    result = await students_collection.insert_one(new_student)
    new_student["id"] = str(result.inserted_id)
    return StudentResponse(**new_student)

@app.get("/students", response_model=list[StudentResponse])
async def get_students():
    students = []
    async for student in students_collection.find({}, {"password": 0}):
        student["id"] = str(student["_id"])
        students.append(StudentResponse(**student))
    return students
