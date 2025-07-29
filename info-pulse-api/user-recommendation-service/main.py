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

# connect the database 
    # postgres:
    # image: postgres:14-alpine
    # ports:
    #   - "5432:5432"
    # volumes:
    #   - postgres_data:/var/lib/postgresql/data
    # environment:
    #   - POSTGRES_PASSWORD=password
    #   - POSTGRES_USER=postgres
    #   - POSTGRES_DB=info-pulse-db
    # restart: unless-stopped
    # healthcheck:
    #   test: ["CMD-SHELL", "pg_isready -U postgres -d info-pulse-db"]
    #   interval: 5s
    #   timeout: 5s
    #   retries: 10
    # networks:
    #   - app-network

# there have news and articles table in the database

# create a new table to save comment and likes and dis likes 

# get and post comment routes 
# get and post like and dis like routes
    
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=3005, 
        reload=True,
        log_level="info"
    )