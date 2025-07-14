from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import asyncio
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import math
import uvicorn

app = FastAPI(title="Article Recommendation Service", version="1.0.0")

# Configuration
GO_SERVICE_URL = "http://localhost:3006"
ARTICLES_API_URL = "http://localhost:3002/articles"

# Pydantic models
class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 10
    exclude_read: bool = True

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict[str, Any]]
    recommendation_reason: str
    timestamp: datetime

class UserProfile(BaseModel):
    user_id: str
    preferred_topics: List[str]
    reading_time_preference: str  # "short", "medium", "long"
    interaction_count: int
    last_activity: datetime

class ArticleData(BaseModel):
    id: str
    title: str
    content: str
    url: str
    topics: List[str]
    keywords: List[str]
    summary_small: str
    summary_large: str
    insertion_date: datetime

# In-memory cache for better performance
user_profiles_cache = {}
articles_cache = {}
cache_timestamp = datetime.now()

async def fetch_user_articles(user_id: str) -> List[str]:
    """Fetch articles interacted with by a user from the Go service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{GO_SERVICE_URL}/articles/user/{user_id}")
            response.raise_for_status()
            data = response.json()
            return data.get("articleIds", [])
        except httpx.HTTPError as e:
            print(f"Error fetching user articles: {e}")
            return []

async def fetch_article_reading_time(article_id: str) -> Dict[str, Any]:
    """Fetch reading time data for a specific article"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{GO_SERVICE_URL}/articles/reading-time/{article_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Error fetching reading time for article {article_id}: {e}")
            return {}

async def fetch_all_articles() -> List[Dict[str, Any]]:
    """Fetch all articles from the articles API"""
    global articles_cache, cache_timestamp
    
    # Cache articles for 5 minutes
    if articles_cache and datetime.now() - cache_timestamp < timedelta(minutes=5):
        return list(articles_cache.values())
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(ARTICLES_API_URL)
            response.raise_for_status()
            articles_data = response.json()
            
            # Update cache
            articles_cache = {article["id"]: article for article in articles_data}
            cache_timestamp = datetime.now()
            
            return articles_data
        except httpx.HTTPError as e:
            print(f"Error fetching articles: {e}")
            return []

async def build_user_profile(user_id: str) -> UserProfile:
    """Build a user profile based on their interaction history"""
    if user_id in user_profiles_cache:
        return user_profiles_cache[user_id]
    
    # Fetch user's article interactions
    user_articles = await fetch_user_articles(user_id)
    
    if not user_articles:
        # Return default profile for new users
        default_profile = UserProfile(
            user_id=user_id,
            preferred_topics=[],
            reading_time_preference="medium",
            interaction_count=0,
            last_activity=datetime.now()
        )
        user_profiles_cache[user_id] = default_profile
        return default_profile
    
    # Fetch all articles to get topic information
    all_articles = await fetch_all_articles()
    articles_dict = {article["id"]: article for article in all_articles}
    
    # Analyze user preferences
    topics_count = Counter()
    total_reading_time = 0
    reading_times = []
    
    for article_id in user_articles:
        if article_id in articles_dict:
            article = articles_dict[article_id]
            topics_count.update(article.get("topics", []))
            
            # Get reading time data
            reading_data = await fetch_article_reading_time(article_id)
            if reading_data:
                reading_time = reading_data.get("readingTimeSec", 0)
                total_reading_time += reading_time
                reading_times.append(reading_time)
    
    # Determine preferred topics (top 3)
    preferred_topics = [topic for topic, _ in topics_count.most_common(3)]
    
    # Determine reading time preference
    avg_reading_time = sum(reading_times) / len(reading_times) if reading_times else 0
    if avg_reading_time < 60:  # Less than 1 minute
        reading_time_preference = "short"
    elif avg_reading_time < 300:  # Less than 5 minutes
        reading_time_preference = "medium"
    else:
        reading_time_preference = "long"
    
    profile = UserProfile(
        user_id=user_id,
        preferred_topics=preferred_topics,
        reading_time_preference=reading_time_preference,
        interaction_count=len(user_articles),
        last_activity=datetime.now()
    )
    
    user_profiles_cache[user_id] = profile
    return profile

def calculate_content_similarity(article1: Dict, article2: Dict) -> float:
    """Calculate similarity between two articles based on topics and keywords"""
    topics1 = set(article1.get("topics", []))
    topics2 = set(article2.get("topics", []))
    
    keywords1 = set(article1.get("keywords", []))
    keywords2 = set(article2.get("keywords", []))
    
    # Calculate topic similarity (weighted more heavily)
    topic_similarity = len(topics1.intersection(topics2)) / max(len(topics1.union(topics2)), 1)
    
    # Calculate keyword similarity
    keyword_similarity = len(keywords1.intersection(keywords2)) / max(len(keywords1.union(keywords2)), 1)
    
    # Combined similarity with topic weight
    return 0.7 * topic_similarity + 0.3 * keyword_similarity

def calculate_article_score(article: Dict, user_profile: UserProfile, user_articles: List[str]) -> float:
    """Calculate recommendation score for an article"""
    score = 0.0
    
    # Topic preference score
    article_topics = set(article.get("topics", []))
    user_topics = set(user_profile.preferred_topics)
    
    if user_topics:
        topic_match = len(article_topics.intersection(user_topics)) / len(user_topics)
        score += topic_match * 0.4
    
    # Recency score (newer articles get higher scores)
    try:
        article_date = datetime.fromisoformat(article["insertionDate"].replace("Z", "+00:00"))
        days_ago = (datetime.now().replace(tzinfo=article_date.tzinfo) - article_date).days
        recency_score = max(0, 1 - (days_ago / 30))  # Decay over 30 days
        score += recency_score * 0.3
    except:
        pass
    
    # Content length preference
    content_length = len(article.get("content", ""))
    if user_profile.reading_time_preference == "short" and content_length < 1000:
        score += 0.2
    elif user_profile.reading_time_preference == "medium" and 1000 <= content_length <= 3000:
        score += 0.2
    elif user_profile.reading_time_preference == "long" and content_length > 3000:
        score += 0.2
    
    # Diversity bonus (slight penalty for very similar content)
    if user_articles:
        all_articles = list(articles_cache.values())
        user_read_articles = [a for a in all_articles if a["id"] in user_articles]
        
        if user_read_articles:
            max_similarity = max(calculate_content_similarity(article, read_article) 
                               for read_article in user_read_articles)
            diversity_score = 1 - max_similarity
            score += diversity_score * 0.1
    
    return score

async def get_collaborative_recommendations(user_id: str, user_articles: List[str], limit: int = 5) -> List[Dict[str, Any]]:
    """Get recommendations based on collaborative filtering (simplified)"""
    # This is a simplified version - in production, you'd want more sophisticated collaborative filtering
    all_articles = await fetch_all_articles()
    articles_dict = {article["id"]: article for article in all_articles}
    
    # Find articles that are similar to what the user has read
    recommendations = []
    
    for read_article_id in user_articles[:5]:  # Consider last 5 articles
        if read_article_id in articles_dict:
            read_article = articles_dict[read_article_id]
            
            # Find similar articles
            similar_articles = []
            for article in all_articles:
                if article["id"] != read_article_id and article["id"] not in user_articles:
                    similarity = calculate_content_similarity(read_article, article)
                    if similarity > 0.3:  # Threshold for similarity
                        similar_articles.append((article, similarity))
            
            # Sort by similarity and add to recommendations
            similar_articles.sort(key=lambda x: x[1], reverse=True)
            recommendations.extend([article for article, _ in similar_articles[:2]])
    
    # Remove duplicates and limit
    seen = set()
    unique_recommendations = []
    for article in recommendations:
        if article["id"] not in seen:
            seen.add(article["id"])
            unique_recommendations.append(article)
        if len(unique_recommendations) >= limit:
            break
    
    return unique_recommendations

@app.get("/")
async def root():
    return {"message": "Article Recommendation Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get personalized article recommendations for a user"""
    try:
        # Build user profile
        user_profile = await build_user_profile(request.user_id)
        
        # Get user's read articles
        user_articles = await fetch_user_articles(request.user_id)
        
        # Fetch all articles
        all_articles = await fetch_all_articles()
        
        # Filter out already read articles if requested
        if request.exclude_read:
            candidate_articles = [article for article in all_articles 
                                if article["id"] not in user_articles]
        else:
            candidate_articles = all_articles
        
        recommendations = []
        
        if user_profile.interaction_count > 0:
            # Content-based recommendations
            scored_articles = []
            for article in candidate_articles:
                score = calculate_article_score(article, user_profile, user_articles)
                scored_articles.append((article, score))
            
            # Sort by score and take top articles
            scored_articles.sort(key=lambda x: x[1], reverse=True)
            content_based = [article for article, _ in scored_articles[:request.limit // 2]]
            
            # Collaborative filtering recommendations
            collaborative = await get_collaborative_recommendations(
                request.user_id, user_articles, request.limit // 2
            )
            
            # Combine recommendations
            recommendations = content_based + collaborative
            recommendation_reason = f"Based on your reading history in {', '.join(user_profile.preferred_topics[:2])} and similar users' preferences"
        else:
            # For new users, recommend popular recent articles
            recent_articles = sorted(candidate_articles, 
                                   key=lambda x: x.get("insertionDate", ""), 
                                   reverse=True)
            recommendations = recent_articles[:request.limit]
            recommendation_reason = "Popular recent articles for new users"
        
        # Ensure we don't exceed the limit
        recommendations = recommendations[:request.limit]
        
        # Format recommendations
        formatted_recommendations = []
        for article in recommendations:
            formatted_recommendations.append({
                "id": article["id"],
                "title": article["title"],
                "summary": article.get("summarySmall", ""),
                "url": article["url"],
                "topics": article.get("topics", []),
                "keywords": article.get("keywords", []),
                "insertionDate": article["insertionDate"]
            })
        
        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=formatted_recommendations,
            recommendation_reason=recommendation_reason,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.get("/user-profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """Get user profile information"""
    try:
        profile = await build_user_profile(user_id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

@app.get("/trending")
async def get_trending_articles(limit: int = Query(10, ge=1, le=50)):
    """Get trending articles based on recent activity"""
    try:
        all_articles = await fetch_all_articles()
        
        # Sort by insertion date (most recent first)
        trending = sorted(all_articles, 
                         key=lambda x: x.get("insertionDate", ""), 
                         reverse=True)
        
        # Format and return
        formatted_trending = []
        for article in trending[:limit]:
            formatted_trending.append({
                "id": article["id"],
                "title": article["title"],
                "summary": article.get("summarySmall", ""),
                "url": article["url"],
                "topics": article.get("topics", []),
                "insertionDate": article["insertionDate"]
            })
        
        return {
            "trending_articles": formatted_trending,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending articles: {str(e)}")

@app.get("/articles/by-topic/{topic}")
async def get_articles_by_topic(topic: str, limit: int = Query(10, ge=1, le=50)):
    """Get articles by topic"""
    try:
        all_articles = await fetch_all_articles()
        
        # Filter by topic
        topic_articles = [article for article in all_articles 
                         if topic.lower() in [t.lower() for t in article.get("topics", [])]]
        
        # Sort by insertion date
        topic_articles.sort(key=lambda x: x.get("insertionDate", ""), reverse=True)
        
        # Format and return
        formatted_articles = []
        for article in topic_articles[:limit]:
            formatted_articles.append({
                "id": article["id"],
                "title": article["title"],
                "summary": article.get("summarySmall", ""),
                "url": article["url"],
                "topics": article.get("topics", []),
                "insertionDate": article["insertionDate"]
            })
        
        return {
            "topic": topic,
            "articles": formatted_articles,
            "count": len(formatted_articles),
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching articles by topic: {str(e)}")

@app.delete("/cache")
async def clear_cache():
    """Clear the application cache"""
    global user_profiles_cache, articles_cache
    user_profiles_cache.clear()
    articles_cache.clear()
    return {"message": "Cache cleared successfully", "timestamp": datetime.now()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3005, reload=True)