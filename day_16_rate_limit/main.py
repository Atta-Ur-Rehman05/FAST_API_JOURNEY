# this file contain rate limiting


from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import time

app = FastAPI()

# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_REQUESTS = 5  # requests per window

# In-memory storage for request counts
request_counts = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    current_time = time.time()
    
    # Initialize request count for this IP if not exists
    if client_ip not in request_counts:
        request_counts[client_ip] = {
            "count": 0,
            "reset_time": current_time + RATE_LIMIT_WINDOW
        }
    
    # Check if the window has reset
    if current_time > request_counts[client_ip]["reset_time"]:
        request_counts[client_ip]["count"] = 0
        request_counts[client_ip]["reset_time"] = current_time + RATE_LIMIT_WINDOW
    
    # Check if rate limit exceeded
    if request_counts[client_ip]["count"] >= RATE_LIMIT_REQUESTS:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too Many Requests"}
        )
    
    # Increment request count
    request_counts[client_ip]["count"] += 1
    
    # Process the request
    response = await call_next(request)
    return response

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Rate Limited API"}

@app.get("/data")
async def get_data():
    return {"data": "This is some protected data"}

