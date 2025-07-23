from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx

app = FastAPI(title="Article Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic models for request/response
class Article(BaseModel):
    id: str
    title: str
    content: str
    url: str
    source: Optional[str] = None  # Made source optional
    insertionDate: str
    summarySmall: str
    keywords: List[str]
    topics: List[str]

class Category(BaseModel):
    id: int
    name: str

class RecommendationResponse(BaseModel):
    user_id: str
    recommended_articles: List[Article]

# API endpoints configuration
ARTICLE_API_URL = "http://localhost:3002/articles"
CATEGORY_API_URL = "http://localhost:3003/api/user/categories/"

async def fetch_articles() -> List[dict]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(ARTICLE_API_URL)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch articles: {str(e)}")

async def fetch_categories(user_id: str) -> List[dict]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CATEGORY_API_URL}{user_id}")
            response.raise_for_status()
            return response.json().get("categories", [])
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_recommendations(user_id: str):
    # Fetch articles and user-preferred categories
    articles = await fetch_articles()
    categories = await fetch_categories(user_id)
    
    # Extract preferred category names
    preferred_categories = [category["name"] for category in categories]
    
    if not preferred_categories:
        raise HTTPException(
            status_code=404,
            detail="No categories found for this user"
        )

    # Filter articles based on preferred categories
    recommended_articles = [
        Article(
            id=article["id"],
            title=article["title"],
            content=article["content"],
            url=article["url"],
            source=article.get("source"),  # Use .get() to handle missing source
            insertionDate=article["insertionDate"],
            summarySmall=article["summarySmall"],
            keywords=article["keywords"],
            topics=article["topics"]
        )
        for article in articles
        if any(topic in preferred_categories for topic in article["topics"])
    ]

    # Sort by insertion date (most recent first)
    recommended_articles.sort(key=lambda x: x.insertionDate, reverse=True)

    return RecommendationResponse(
        user_id=user_id,
        recommended_articles=recommended_articles
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3005, reload=True)