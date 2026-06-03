from pydantic import BaseModel


class StudentBase(BaseModel):
    name: str
    age: int


class StudentCreate(StudentBase):
    pass


class StudentRead(StudentBase):
    id: int

    class Config:
        orm_mode = True
