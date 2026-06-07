from fastapi import FastAPI
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World!"}

@app.get("/home")
async def home():
    return {"message": "Welcome to the home page!"}
