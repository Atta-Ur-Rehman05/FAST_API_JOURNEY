from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Hello FastAPI"}

@app.get("/about")
def about():
    return {"message": "About FastAPI"}

@app.get("/contact")
def contact():
    return {"message": "Contact FastAPI"}

@app.get("/services")
def services():
    return {"message": "Services FastAPI"}

@app.get("/products")
def products():
    return {"message": "Products FastAPI"}

@app.get("/products/{id}")
def product(id: int):
    return {"message": f"Product {id}"}