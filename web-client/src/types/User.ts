import { Article } from "./Article";
import { Topics } from "./Topics";

export interface User {
    id: string;
    username: string;
    email: string;
    is_admin: boolean;
    joined_at: string;
}

export interface UserTopics {
    topics: Topics[]
}

export interface UserPreferences {
    favoriteTopics: Topics[];
    favoriteArticles: Article[];
    readingHistory: Article[];
}


export interface UserRecommendations {
    recommendations: Article[];
}

