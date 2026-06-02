# Day 01 – FastAPI Basics 🚀

Today I started my FastAPI learning journey and covered the fundamental concepts required to build APIs.

## Topics Covered

### 1. Introduction to FastAPI

* What FastAPI is and why it is popular.
* Advantages of FastAPI:

  * High performance
  * Automatic API documentation
  * Type hints support
  * Easy data validation with Pydantic

### 2. Path Parameters

* Learned how to capture dynamic values from URLs.
* Built endpoints using path parameters.
* Example:

```python
@app.get("/students/{student_id}")
def get_student(student_id: int):
    return {"student_id": student_id}
```

### 3. Query Parameters

* Learned how to pass optional data through the URL.
* Used query parameters for filtering and searching.
* Example:

```python
@app.get("/students/")
def get_students(name: str = None):
    return {"name": name}
```



## Key Learnings

* Difference between Path Parameters and Query Parameters.
* How FastAPI automatically validates incoming data.
* Understanding the basic structure of a FastAPI application.

## Practical Work

* Created multiple GET and POST endpoints.
* Practiced handling path parameters, query parameters, 
* Tested APIs using Swagger UI.

## Day 01 Summary

Successfully completed the FastAPI fundamentals and built my first API endpoints. Gained a clear understanding of how data flows through APIs using paths, queries. This forms the foundation for building more advanced REST APIs in the coming days.

#FastAPI #Python #BackendDevelopment #APIs #LearningJourney #Day01
