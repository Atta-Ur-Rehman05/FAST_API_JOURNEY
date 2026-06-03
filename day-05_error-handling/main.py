# error handlng 
# 1. HTTPException: This is a built-in exception provided by FastAPI that allows you to return custom HTTP status codes and error messages when an error occurs in your API endpoints.
# 2. Custom Exception Handlers: You can create custom exception handlers to handle specific types of exceptions that may occur in your application. This allows you to provide more detailed error messages and handle errors in a way that is specific to your application's needs.
# 3. Global Exception Handling: You can also implement global exception handling to catch any unhandled exceptions that may occur in your application. This ensures that your API returns a consistent error response format, even for unexpected errors.





from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/divide")
async def divide(a: float, b: float):
    if b == 0:
        raise HTTPException(status_code=400, detail="Division by zero is not allowed")
    result = a / b
    return {"result": result}   


@app.get("/items/{item_id}")
async def read_item(item_id: int):
    if item_id < 0:
        raise HTTPException(status_code=400, detail="Item ID must be a positive integer")
    return {"item_id": item_id}


@app.get("/users/{user_id}")
async def read_user(user_id: int):
    if user_id < 0:
        raise HTTPException(status_code=400, detail="User ID must be a positive integer")
    return {"user_id": user_id}


# custom exception
# its a user defined exception class that can be used to handle specific error scenarios in your application. By defining a custom exception, 
# you can provide more meaningful error messages and handle errors in a way that is specific to your application's needs.
#  In this example, we define a CustomException class that takes a name parameter and raises this exception when the /custom-error 
# endpoint is accessed with the name "error". The custom exception handler then returns a JSON response with the appropriate status code and error message
#  when this exception is raised.

class CustomException(Exception):
    def __init__(self, name: str):
        self.name = name

@app.get("/custom-error")
async def custom_error(name: str):
    if name == "error":
        raise CustomException(name=name)
    return {"message": f"Hello {name}"}



# custom error handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )


# global error handling

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred"},
    )

@app.get("/cause-error")
async def cause_error():
    raise Exception("This is a test error")


# global exception handler for custom exception
# This code defines a custom exception handler for the CustomException class. When a CustomException is raised in the application, 
# this handler will be invoked to return a JSON response with a status code of 400 and a message indicating that a custom error occurred, 
# along with the name of the error. This allows you to provide specific error handling for your custom exceptions and return meaningful responses to the client
#  when such exceptions occur.

@app.exception_handler(CustomException)
async def custom_exception_handler(request, exc: CustomException):
    return JSONResponse(
        status_code=400,
        content={"message": f"Custom error occurred: {exc.name}"},
    )       




# real example of error handling

class user_not_found_exception(Exception):
    def __init__(self, user_id: int):
        self.user_id = user_id
@app.exception_handler(user_not_found_exception)
async def user_not_found_exception_handler(request, exc: user_not_found_exception):
    return JSONResponse(
        status_code=404,
        content={"message": f"User with ID {exc.user_id} not found"},
    )


@app.get("/users/{user_id}")
async def get_user(user_id: int):
    if user_id != 1:
        raise user_not_found_exception(user_id=user_id)

    return {
        "success": True,
        "data": {
            "user_id": user_id,
            "name": "attaur rehman",
        }
    }

