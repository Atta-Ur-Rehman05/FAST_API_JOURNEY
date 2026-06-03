# middleware
# Middleware is a function that runs before or after the request is processed by the endpoint function. 
# It can be used to modify the request or response, or to perform some action before or after the request is processed.

from fastapi import FastAPI, Request
app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response: {response.status_code}")
    return response


# time middleware

import time
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# authentication middleware

from fastapi import HTTPException
@app.middleware("http")
async def authenticate(request: Request, call_next):
    api_key = request.headers.get("X-API-Key")
    if  api_key != "secret":
        raise HTTPException(status_code=401, detail="Invalid API Key")
    response = await call_next(request)
    return response


# custom middleware
@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    print("Custom Middleware: Before Request")
    response = await call_next(request)
    print("Custom Middleware: After Request")
    return response


# check jwt token in header
@app.middleware("http")
async def check_jwt_token(request: Request, call_next):
    token = request.headers.get("Authorization")
    if token != "Bearer secret":        
        raise HTTPException(status_code=401, detail="Invalid JWT Token")
    response = await call_next(request)
    return response
