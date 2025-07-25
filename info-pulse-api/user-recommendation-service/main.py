from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
import asyncio
from datetime import datetime
import logging
from collections import Counter
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Article Recommendation API",
    description="Personalized article recommendation service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic models
class Article(BaseModel):
    id: int
    title: str
    content: str
    published_at: str
    image_url: Optional[str] = None
    keywords: List[str] = []
    topics: List[str] = []
    category_name: Optional[str] = None
    author_name: Optional[str] = None
    created_at: str

class Category(BaseModel):
    id: int
    name: str

class UserPreferences(BaseModel):
    user_id: str
    preferred_categories: List[Category]

class RecommendationRequest(BaseModel):
    user_id: str
    limit: Optional[int] = Field(default=10, ge=1, le=50)
    include_similar: Optional[bool] = Field(default=True)

class RecommendationResponse(BaseModel):
    user_id: str
    total_recommendations: int
    recommended_articles: List[Article]
    recommendation_score: Dict[int, float] = {}
    categories_matched: List[str] = []

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, str]

# Configuration
USER_SERVICE_URL = "http://localhost:3003"
ARTICLE_SERVICE_URL = "http://localhost:3003"

class RecommendationEngine:
    def __init__(self):
        self.keyword_weights = {
            'title': 3.0,
            'content': 1.0,
            'category': 2.0,
            'topics': 2.5,
            'keywords': 2.0
        }
    
    async def fetch_user_categories(self, user_id: str) -> List[Dict]:
        """Fetch user's preferred categories"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{USER_SERVICE_URL}/api/user/categories/{user_id}")
                response.raise_for_status()
                return response.json().get("categories", [])
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch user categories: {str(e)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch user categories: {str(e)}"
                )
    
    async def fetch_articles(self, limit: int = 100) -> List[Dict]:
        """Fetch articles from the article service"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{ARTICLE_SERVICE_URL}/api/articles",
                    params={"limit": limit, "page": 1}
                )
                response.raise_for_status()
                return response.json().get("articles", [])
            except httpx.HTTPError as e:
                logger.error(f"Failed to fetch articles: {str(e)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to fetch articles: {str(e)}"
                )
    
    def calculate_content_similarity(self, user_interests: List[str], article: Dict) -> float:
        """Calculate content similarity score based on keywords and topics"""
        score = 0.0
        
        # Normalize user interests
        user_interests_lower = [interest.lower() for interest in user_interests]
        
        # Check title similarity
        title_words = re.findall(r'\w+', article.get('title', '').lower())
        title_matches = sum(1 for word in title_words if any(interest in word for interest in user_interests_lower))
        score += title_matches * self.keyword_weights['title']
        
        # Check content similarity (first 500 characters to avoid performance issues)
        content_snippet = article.get('content', '')[:500].lower()
        content_matches = sum(1 for interest in user_interests_lower if interest in content_snippet)
        score += content_matches * self.keyword_weights['content']
        
        # Check topics similarity
        article_topics = [topic.lower() for topic in article.get('topics', [])]
        topic_matches = sum(1 for topic in article_topics if any(interest in topic for interest in user_interests_lower))
        score += topic_matches * self.keyword_weights['topics']
        
        # Check keywords similarity
        article_keywords = [keyword.lower() for keyword in article.get('keywords', [])]
        keyword_matches = sum(1 for keyword in article_keywords if any(interest in keyword for interest in user_interests_lower))
        score += keyword_matches * self.keyword_weights['keywords']
        
        return score
    
    def calculate_recency_score(self, published_at: str) -> float:
        """Calculate recency score - more recent articles get higher scores"""
        try:
            published_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            current_date = datetime.now(published_date.tzinfo)
            days_diff = (current_date - published_date).days
            
            # Exponential decay: newer articles get higher scores
            return max(0.1, 1.0 / (1.0 + days_diff * 0.1))
        except Exception:
            return 0.5  # Default score if date parsing fails
    
    async def generate_recommendations(
        self, 
        user_id: str, 
        limit: int = 10, 
        include_similar: bool = True
    ) -> RecommendationResponse:
        """Generate personalized article recommendations"""
        
        # Fetch user preferences and articles concurrently
        user_categories, articles = await asyncio.gather(
            self.fetch_user_categories(user_id),
            self.fetch_articles(limit * 5)  # Fetch more articles to have better selection
        )
        
        if not user_categories:
            raise HTTPException(
                status_code=404, 
                detail="No categories found for this user"
            )
        
        if not articles:
            raise HTTPException(
                status_code=404, 
                detail="No articles available"
            )
        
        # Extract category names and create user interest profile
        preferred_category_names = [cat["name"].lower() for cat in user_categories]
        user_interests = preferred_category_names.copy()
        
        # Score articles
        scored_articles = []
        categories_matched = set()
        
        for article in articles:
            score = 0.0
            
            # Category matching score
            article_category = article.get('category_name', '').lower()
            if article_category in preferred_category_names:
                score += self.keyword_weights['category']
                categories_matched.add(article_category.title())
            
            # Content similarity score (if include_similar is True)
            if include_similar:
                content_score = self.calculate_content_similarity(user_interests, article)
                score += content_score
            
            # Recency score
            recency_score = self.calculate_recency_score(article.get('published_at', ''))
            score += recency_score
            
            # Only include articles with some relevance
            if score > 0.5:
                scored_articles.append({
                    'article': article,
                    'score': score
                })
        
        # Sort by score and limit results
        scored_articles.sort(key=lambda x: x['score'], reverse=True)
        top_articles = scored_articles[:limit]
        
        # Convert to Article models
        recommended_articles = []
        recommendation_scores = {}
        
        for item in top_articles:
            article_data = item['article']
            try:
                article = Article(
                    id=article_data['id'],
                    title=article_data['title'],
                    content=article_data['content'],
                    published_at=article_data['published_at'],
                    image_url=article_data.get('image_url'),
                    keywords=article_data.get('keywords', []),
                    topics=article_data.get('topics', []),
                    category_name=article_data.get('category_name'),
                    author_name=article_data.get('author_name'),
                    created_at=article_data['created_at']
                )
                recommended_articles.append(article)
                recommendation_scores[article.id] = round(item['score'], 2)
            except Exception as e:
                logger.warning(f"Failed to parse article {article_data.get('id')}: {str(e)}")
                continue
        
        return RecommendationResponse(
            user_id=user_id,
            total_recommendations=len(recommended_articles),
            recommended_articles=recommended_articles,
            recommendation_score=recommendation_scores,
            categories_matched=list(categories_matched)
        )

# Initialize recommendation engine
recommendation_engine = RecommendationEngine()

# API Routes
@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get personalized article recommendations for a user"""
    try:
        logger.info(f"Generating recommendations for user {request.user_id}")
        recommendations = await recommendation_engine.generate_recommendations(
            user_id=request.user_id,
            limit=request.limit,
            include_similar=request.include_similar
        )
        logger.info(f"Generated {recommendations.total_recommendations} recommendations")
        return recommendations
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_recommendations_by_user_id(
    user_id: str,
    limit: int = Query(default=10, ge=1, le=50, description="Number of recommendations to return"),
    include_similar: bool = Query(default=True, description="Include content-based similarity matching")
):
    """Get personalized article recommendations for a user (GET endpoint)"""
    request = RecommendationRequest(
        user_id=user_id,
        limit=limit,
        include_similar=include_similar
    )
    return await get_recommendations(request)

@app.get("/user/{user_id}/preferences", response_model=UserPreferences)
async def get_user_preferences(user_id: str):
    """Get user's category preferences"""
    try:
        categories_data = await recommendation_engine.fetch_user_categories(user_id)
        categories = [Category(**cat) for cat in categories_data]
        return UserPreferences(
            user_id=user_id,
            preferred_categories=categories
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/articles/trending", response_model=List[Article])
async def get_trending_articles(limit: int = Query(default=20, ge=1, le=100)):
    """Get trending articles based on recency and general popularity"""
    try:
        articles_data = await recommendation_engine.fetch_articles(limit)
        articles = []
        
        for article_data in articles_data:
            try:
                article = Article(
                    id=article_data['id'],
                    title=article_data['title'],
                    content=article_data['content'],
                    published_at=article_data['published_at'],
                    image_url=article_data.get('image_url'),
                    keywords=article_data.get('keywords', []),
                    topics=article_data.get('topics', []),
                    category_name=article_data.get('category_name'),
                    author_name=article_data.get('author_name'),
                    created_at=article_data['created_at']
                )
                articles.append(article)
            except Exception as e:
                logger.warning(f"Failed to parse trending article: {str(e)}")
                continue
        
        return articles
    except Exception as e:
        logger.error(f"Error fetching trending articles: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    services_status = {}
    
    # Check user service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{USER_SERVICE_URL}/health")
            services_status["user_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        services_status["user_service"] = "unreachable"
    
    # Check article service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ARTICLE_SERVICE_URL}/health")
            services_status["article_service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        services_status["article_service"] = "unreachable"
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        services=services_status
    )

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Article Recommendation API",
        "version": "1.0.0",
        "endpoints": {
            "POST /recommendations": "Get personalized recommendations",
            "GET /recommendations/{user_id}": "Get recommendations by user ID",
            "GET /user/{user_id}/preferences": "Get user preferences",
            "GET /articles/trending": "Get trending articles",
            "GET /health": "Health check",
            "GET /docs": "API documentation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=3005, 
        reload=True,
        log_level="info"
    )