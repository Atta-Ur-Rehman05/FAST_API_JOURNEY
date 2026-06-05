# this file contain upload file static example

from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import os

app = FastAPI()

# ensure the uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# static file setup
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# endpoint to upload file
@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    # define the local storage distination for the uploaded file
    file_location = f"uploads/{file.filename}"
    # save the uploaded file to the local storage
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "url": f"/static/{file.filename}"}

# endpoint to list all uploaded files
@app.get("/files/{filename}")
async def list_files(filename: str):
    files = os.listdir("uploads")
    return {"files": files}



# summary:
# This code defines a FastAPI application that allows users to upload files and access them as static files.
#  The application creates an "uploads" directory if it doesn't exist,
#  and mounts it as a static file directory at the "/static" endpoint. The "/uploadfile/" endpoint accepts file uploads and saves them to the "uploads" directory,
#  returning the filename and URL for accessing the file. The "/files/{filename}" endpoint lists all uploaded files in the "uploads" directory.
