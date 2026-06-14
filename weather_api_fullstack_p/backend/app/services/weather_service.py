import requests
from fastapi import HTTPException
from app.core.config import settings

def get_weather_data(city: str):
    params = {
        "q": city,
        "appid": settings.weather_api_key,
        "units": "metric"
    }
    response = requests.get(settings.weather_api_url, params=params)
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Could not fetch weather data for the specified city")
        
    data = response.json()
    weather_data = {
        "city": data.get("name", city),
        "temperature": f"{data['main']['temp']}°C",
        "condition": data['weather'][0]['main'],
        "humidity": f"{data['main']['humidity']}%"
    }
    return weather_data
